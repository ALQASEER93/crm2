const request = require('supertest');
const { app, ready } = require('..');
const { resetDatabase } = require('../db');
const { Hcp, Territory, SalesRep, Visit } = require('../models');

const createFixtureData = async () => {
  const [north, south] = await Territory.bulkCreate([
    { name: 'North Territory', code: 'N' },
    { name: 'South Territory', code: 'S' },
  ]);

  const [repOne, repTwo] = await SalesRep.bulkCreate([
    { name: 'Rep One', email: 'rep.one@example.com', territoryId: north.id },
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

  beforeAll(async () => {
    await ready;
  });

  beforeEach(async () => {
    await resetDatabase();
    fixtures = await createFixtureData();
  });

  it('returns paginated visits ordered by latest visit date by default', async () => {
    const response = await request(app)
      .get('/api/visits?page=1&pageSize=2')
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
      .expect(200);

    const durations = response.body.data.map(visit => visit.durationMinutes);
    expect(durations).toEqual([0, 20, 40, 55]);
  });

  it('provides aggregate summary data', async () => {
    const response = await request(app)
      .get('/api/visits/summary?status=completed')
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
      .expect(400);

    expect(response.body).toMatchObject({
      message: 'Invalid query parameters.',
    });
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors[0]).toMatch(/page must be a positive integer/i);
  });
});
