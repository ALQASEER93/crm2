const request = require('supertest');
const { app, ready } = require('..');
const { resetDatabase } = require('../db');
const { Hcp, Territory, SalesRep, Visit } = require('../models');

const loginAsAdmin = async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'password' })
    .expect(200);

  return response.headers['x-auth-token'];
};

const loginAsRep = async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'rep@example.com', password: 'password' })
    .expect(200);

  return response.headers['x-auth-token'];
};

const createFixtureData = async () => {
  const [north, south] = await Territory.bulkCreate([
    { name: 'North Territory', code: 'N' },
    { name: 'South Territory', code: 'S' },
  ]);

  const [repOne, repTwo] = await SalesRep.bulkCreate([
    { name: 'Rep One', email: 'rep@example.com', territoryId: north.id },
    { name: 'Rep Two', email: 'rep.two@example.com', territoryId: south.id },
  ]);

  const [hcpAlpha, hcpBeta, hcpGamma] = await Hcp.bulkCreate([
    { name: 'Dr. Alpha', areaTag: 'City Hospital - Cardio', specialty: 'Cardiology' },
    { name: 'Dr. Beta', areaTag: 'Metro Clinic - Neuro', specialty: 'Neurology' },
    { name: 'Dr. Gamma', areaTag: 'Regional Center - Trauma', specialty: 'Trauma' },
  ]);

  const visits = await Visit.bulkCreate([
    {
      visitDate: '2024-05-10',
      status: 'completed',
      durationMinutes: 40,
      notes: 'Discussed performance metrics.',
      repId: repOne.id,
      hcpId: hcpAlpha.id,
      territoryId: north.id,
    },
    {
      visitDate: '2024-05-11',
      status: 'scheduled',
      durationMinutes: 20,
      notes: 'Planned product demonstration.',
      repId: repTwo.id,
      hcpId: hcpBeta.id,
      territoryId: south.id,
    },
    {
      visitDate: '2024-05-09',
      status: 'completed',
      durationMinutes: 55,
      notes: 'Follow-up on training.',
      repId: repOne.id,
      hcpId: hcpGamma.id,
      territoryId: north.id,
    },
    {
      visitDate: '2024-05-08',
      status: 'cancelled',
      durationMinutes: 0,
      notes: 'HCP unavailable.',
      repId: repTwo.id,
      hcpId: hcpAlpha.id,
      territoryId: south.id,
    },
  ]);

  return {
    territories: { north, south },
    reps: { repOne, repTwo },
    hcps: { hcpAlpha, hcpBeta, hcpGamma },
    visits,
  };
};

describe('Visits API', () => {
  let fixtures;
  let authToken;

  beforeAll(async () => {
    await ready;
  });

  beforeEach(async () => {
    await resetDatabase();
    fixtures = await createFixtureData();
    authToken = await loginAsAdmin();
  });

  it('returns paginated visits ordered by latest visit date by default', async () => {
    const response = await request(app)
      .get('/api/visits?page=1&pageSize=2')
      .set('X-Auth-Token', authToken)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta).toMatchObject({
      page: 1,
      pageSize: 2,
      total: 4,
      totalPages: 2,
      sortBy: 'visitDate',
      sortDirection: 'desc',
    });
    const dates = response.body.data.map(visit => visit.visitDate);
    expect(dates).toEqual(['2024-05-11', '2024-05-10']);
  });

  it('filters visits by status and territory', async () => {
    const response = await request(app)
      .get(`/api/visits?status=completed&territoryId=${fixtures.territories.north.id}`)
      .set('X-Auth-Token', authToken)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    for (const visit of response.body.data) {
      expect(visit.status).toBe('completed');
      expect(visit.territory.id).toBe(fixtures.territories.north.id);
    }
    expect(response.body.meta.total).toBe(2);
  });

  it('sorts visits by duration when requested', async () => {
    const response = await request(app)
      .get('/api/visits?sortBy=durationMinutes&sortDirection=asc&pageSize=5')
      .set('X-Auth-Token', authToken)
      .expect(200);

    const durations = response.body.data.map(visit => visit.durationMinutes);
    expect(durations).toEqual([0, 20, 40, 55]);
  });

  it('provides aggregate summary data', async () => {
    const response = await request(app)
      .get('/api/visits/summary?status=completed')
      .set('X-Auth-Token', authToken)
      .expect(200);

    expect(response.body.data).toMatchObject({
      totalVisits: 2,
      completedVisits: 2,
      scheduledVisits: 0,
      cancelledVisits: 0,
      uniqueHcps: 2,
      uniqueReps: 1,
      uniqueTerritories: 1,
    });
    expect(response.body.data.averageDurationMinutes).toBeGreaterThan(0);
  });

  it('exports visits as CSV with the expected headers', async () => {
    const response = await request(app)
      .get(`/api/visits/export?repId=${fixtures.reps.repOne.id}`)
      .set('X-Auth-Token', authToken)
      .expect(200);

    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('visits.csv');
    const lines = response.text.trim().split('\n');
    expect(lines[0]).toContain('Visit Date,Status,Duration (minutes)');
    expect(lines).toHaveLength(1 + 2); // header + two records
  });

  it('returns a validation error for invalid pagination input', async () => {
    const response = await request(app)
      .get('/api/visits?page=0')
      .set('X-Auth-Token', authToken)
      .expect(400);

    expect(response.body).toMatchObject({
      message: 'Invalid query parameters.',
    });
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors[0]).toMatch(/page must be a positive integer/i);
  });
});

describe('Visits Reports API', () => {
  let fixtures;
  let authToken;

  beforeAll(async () => {
    await ready;
  });

  beforeEach(async () => {
    await resetDatabase();
    fixtures = await createFixtureData();
    authToken = await loginAsAdmin();
  });

  const requestReport = query =>
    request(app)
      .get(`/api/reports/visits?${query}`)
      .set('X-Auth-Token', authToken)
      .expect(200);

  it('returns aggregated counts within the requested date range', async () => {
    const response = await requestReport('from=2024-05-08&to=2024-05-11');

    expect(response.body.bySalesRepPerDay).toEqual([
      { salesRepId: fixtures.reps.repTwo.id, date: '2024-05-08', count: 1 },
      { salesRepId: fixtures.reps.repOne.id, date: '2024-05-09', count: 1 },
      { salesRepId: fixtures.reps.repOne.id, date: '2024-05-10', count: 1 },
      { salesRepId: fixtures.reps.repTwo.id, date: '2024-05-11', count: 1 },
    ]);

    expect(response.body.byHcp).toEqual([
      { hcpId: fixtures.hcps.hcpAlpha.id, count: 2 },
      { hcpId: fixtures.hcps.hcpBeta.id, count: 1 },
      { hcpId: fixtures.hcps.hcpGamma.id, count: 1 },
    ]);
  });

  it('filters aggregates by salesRepId', async () => {
    const response = await requestReport(
      `from=2024-05-08&to=2024-05-11&salesRepId=${fixtures.reps.repOne.id}`
    );

    expect(response.body.bySalesRepPerDay).toEqual([
      { salesRepId: fixtures.reps.repOne.id, date: '2024-05-09', count: 1 },
      { salesRepId: fixtures.reps.repOne.id, date: '2024-05-10', count: 1 },
    ]);

    expect(response.body.byHcp).toEqual([
      { hcpId: fixtures.hcps.hcpAlpha.id, count: 1 },
      { hcpId: fixtures.hcps.hcpGamma.id, count: 1 },
    ]);
  });

  it('filters aggregates by hcpId', async () => {
    const response = await requestReport(
      `from=2024-05-08&to=2024-05-11&hcpId=${fixtures.hcps.hcpAlpha.id}`
    );

    expect(response.body.bySalesRepPerDay).toEqual([
      { salesRepId: fixtures.reps.repTwo.id, date: '2024-05-08', count: 1 },
      { salesRepId: fixtures.reps.repOne.id, date: '2024-05-10', count: 1 },
    ]);

    expect(response.body.byHcp).toEqual([
      { hcpId: fixtures.hcps.hcpAlpha.id, count: 2 },
    ]);
  });

  it('returns empty aggregates when no visits exist in the range', async () => {
    const response = await requestReport('from=2024-06-01&to=2024-06-30');

    expect(response.body.bySalesRepPerDay).toEqual([]);
    expect(response.body.byHcp).toEqual([]);
  });
});

describe('Visits CRUD API', () => {
  let fixtures;
  let adminToken;
  let repToken;

  beforeAll(async () => {
    await ready;
  });

  beforeEach(async () => {
    await resetDatabase();
    fixtures = await createFixtureData();
    adminToken = await loginAsAdmin();
    repToken = await loginAsRep();
  });

  it('creates a visit with valid references', async () => {
    const payload = {
      visitDate: '2024-05-12',
      status: 'scheduled',
      durationMinutes: 30,
      repId: fixtures.reps.repTwo.id,
      hcpId: fixtures.hcps.hcpBeta.id,
      territoryId: fixtures.territories.south.id,
      notes: 'Prep for follow-up',
    };

    const response = await request(app)
      .post('/api/visits')
      .set('X-Auth-Token', adminToken)
      .send(payload)
      .expect(201);

    expect(response.body.data).toMatchObject({
      visitDate: '2024-05-12',
      status: 'scheduled',
      rep: { id: fixtures.reps.repTwo.id, name: fixtures.reps.repTwo.name },
      hcp: { id: fixtures.hcps.hcpBeta.id },
      territory: { id: fixtures.territories.south.id },
    });

    const list = await request(app)
      .get('/api/visits?pageSize=10')
      .set('X-Auth-Token', adminToken)
      .expect(200);

    expect(list.body.meta.total).toBe(5);
  });

  it('updates a visit status and date', async () => {
    const target = fixtures.visits[0];

    const response = await request(app)
      .put(`/api/visits/${target.id}`)
      .set('X-Auth-Token', adminToken)
      .send({
        status: 'cancelled',
        visitDate: '2024-05-15',
      })
      .expect(200);

    expect(response.body.data.status).toBe('cancelled');
    expect(response.body.data.visitDate).toBe('2024-05-15');
  });

  it('soft deletes a visit and hides it from listings', async () => {
    const target = fixtures.visits[0];

    await request(app)
      .delete(`/api/visits/${target.id}`)
      .set('X-Auth-Token', adminToken)
      .expect(204);

    const deleted = await Visit.findByPk(target.id);
    expect(deleted.isDeleted).toBe(true);

    const list = await request(app)
      .get('/api/visits?pageSize=10')
      .set('X-Auth-Token', adminToken)
      .expect(200);

    expect(list.body.meta.total).toBe(3);
    expect(list.body.data.find(visit => visit.id === target.id)).toBeUndefined();
  });

  it('prevents a sales rep from modifying a visit owned by another rep', async () => {
    const target = fixtures.visits[1]; // belongs to repTwo

    const response = await request(app)
      .put(`/api/visits/${target.id}`)
      .set('X-Auth-Token', repToken)
      .send({ status: 'completed' })
      .expect(403);

    expect(response.body).toEqual({ message: 'Insufficient permissions.' });
  });
});
