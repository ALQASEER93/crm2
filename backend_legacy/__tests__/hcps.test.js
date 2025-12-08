const request = require('supertest');
const { app, ready } = require('..');
const { resetDatabase } = require('../db');
const { Hcp } = require('../models');
const { normalizeHcpRows } = require('../services/hcpsImport');

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

const createFixtures = async () => {
  await Hcp.bulkCreate([
    {
      name: 'Dr. Alpha',
      specialty: 'Cardiology',
      city: 'Riyadh',
      area: 'North',
      segment: 'A',
      phone: '1111',
    },
    {
      name: 'Dr. Beta',
      specialty: 'Neurology',
      city: 'Riyadh',
      area: 'East',
      segment: 'B',
      phone: '2222',
    },
    {
      name: 'Dr. Gamma',
      specialty: 'Pediatrics',
      city: 'Jeddah',
      area: 'West',
      segment: 'C',
      phone: '3333',
    },
  ]);
};

describe('HCP API', () => {
  let adminToken;

  beforeAll(async () => {
    await ready;
  });

  beforeEach(async () => {
    await resetDatabase();
    adminToken = await loginAsAdmin();
  });

  it('returns empty data with pagination when no HCPs exist', async () => {
    const response = await request(app)
      .get('/api/hcps')
      .set('X-Auth-Token', adminToken)
      .expect(200);

    expect(response.body).toEqual({
      data: [],
      pagination: {
        page: 1,
        pageSize: 25,
        total: 0,
        totalPages: 1,
      },
    });
  });

  it('filters HCPs by city and specialty with pagination', async () => {
    await createFixtures();

    const response = await request(app)
      .get('/api/hcps?city=riyadh&specialty=cardio&pageSize=1')
      .set('X-Auth-Token', adminToken)
      .expect(200);

    expect(response.body.pagination.total).toBe(1);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Dr. Alpha');
  });

  it('imports HCP rows for privileged users and rejects reps', async () => {
    const rows = [
      {
        Name: 'Dr. Delta',
        Specialty: 'Oncology',
        City: 'Dammam',
        Area: 'Central',
        Segment: 'A',
        Phone: '4444',
      },
      {
        Name: 'Dr. Alpha',
        Specialty: 'Cardiology',
        City: 'Riyadh',
        Area: 'North',
      },
    ];

    // Ensure non privileged role gets blocked
    const repToken = await loginAsRep();
    await request(app)
      .post('/api/hcps/import')
      .set('X-Auth-Token', repToken)
      .send({ rows })
      .expect(403);

    await createFixtures();

    const response = await request(app)
      .post('/api/hcps/import')
      .set('X-Auth-Token', adminToken)
      .send({ rows })
      .expect(200);

    expect(response.body).toMatchObject({
      created: 1,
      updated: 1,
      skipped: 0,
      total: rows.length,
    });

    const all = await Hcp.findAll({ order: [['name', 'ASC']] });
    expect(all.map(hcp => hcp.name)).toContain('Dr. Delta');
  });

  it('exports HCPs as CSV', async () => {
    await createFixtures();

    const response = await request(app)
      .get('/api/hcps/export')
      .set('X-Auth-Token', adminToken)
      .expect(200);

    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('hcps.csv');
    const lines = response.text.trim().split('\n');
    expect(lines[0]).toContain('Name,Specialty,City,Area');
    expect(lines.length).toBeGreaterThan(1);
  });
});

describe('normalizeHcpRows', () => {
  it('normalizes common Excel columns into HCP payloads', () => {
    const rows = [
      {
        Name: '  Dr. Example ',
        Specialty: 'Cardio ',
        City: 'Riyadh',
        Area: 'North ',
        Segment: 'A',
        Phone: '123',
        Mobile: '456',
        Email: 'TEST@EXAMPLE.COM',
      },
    ];

    const normalized = normalizeHcpRows(rows);
    expect(normalized).toEqual([
      {
        name: 'Dr. Example',
        specialty: 'Cardio',
        city: 'Riyadh',
        area: 'North',
        segment: 'A',
        phone: '123',
        mobile: '456',
        email: 'test@example.com',
      },
    ]);
  });

  it('excludes rows missing a name', () => {
    const normalized = normalizeHcpRows([{ City: 'Riyadh' }]);
    expect(normalized).toEqual([]);
  });
});
