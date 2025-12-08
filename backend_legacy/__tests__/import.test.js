const request = require('supertest');
const { app, ready } = require('..');
const Hcp = require('../models/hcp');

describe('HCP import API', () => {
  let adminToken;
  let repToken;

  beforeAll(async () => {
    await ready;
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
      .expect(200);

    adminToken = adminLogin.headers['x-auth-token'];

    const repLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rep@example.com', password: 'password' })
      .expect(200);

    repToken = repLogin.headers['x-auth-token'];
  });

  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/import/hcps')
      .send({ records: [] })
      .expect(401);

    expect(response.body).toEqual({ message: 'Authentication token missing.' });
  });

  it('rejects insufficient roles', async () => {
    const response = await request(app)
      .post('/api/import/hcps')
      .set('X-Auth-Token', repToken)
      .send({
        records: [
          {
            name: 'Unauthorized Attempt',
            areaTag: 'Test',
            specialty: 'Testing',
          },
        ],
      })
      .expect(403);

    expect(response.body).toEqual({ message: 'Insufficient permissions.' });
  });

  it('imports a new HCP using the name + area tag composite key', async () => {
    const payload = {
      records: [
        {
          name: 'Dr. Cristina Yang',
          areaTag: 'Seattle Grace - Cardio',
          specialty: 'Cardiothoracic Surgery',
        },
      ],
    };

    const response = await request(app)
      .post('/api/import/hcps')
      .set('X-Auth-Token', adminToken)
      .send(payload)
      .expect(200);

    expect(response.body).toMatchObject({
      created: 1,
      updated: 0,
      rejected: 0,
      total: 1,
    });

    const stored = await Hcp.findOne({
      where: { name: 'Dr. Cristina Yang', areaTag: 'Seattle Grace - Cardio' },
    });
    expect(stored).toBeTruthy();
    expect(stored.specialty).toBe('Cardiothoracic Surgery');
    expect(stored.phone).toBeNull();
    expect(stored.email).toBeNull();
  });

  it('counts a re-import of the same row as an update', async () => {
    const record = {
      name: 'Dr. Addison Montgomery',
      areaTag: 'Seattle Grace - OB',
      specialty: 'Neonatal Surgery',
    };

    await request(app)
      .post('/api/import/hcps')
      .set('X-Auth-Token', adminToken)
      .send({ records: [record] })
      .expect(200);

    const response = await request(app)
      .post('/api/import/hcps')
      .set('X-Auth-Token', adminToken)
      .send({
        records: [
          {
            ...record,
            specialty: 'Maternal-Fetal Medicine',
          },
        ],
      })
      .expect(200);

    expect(response.body).toMatchObject({
      created: 0,
      updated: 1,
      rejected: 0,
      total: 1,
    });

    const updated = await Hcp.findOne({
      where: { name: 'Dr. Addison Montgomery', areaTag: 'Seattle Grace - OB' },
    });
    expect(updated.specialty).toBe('Maternal-Fetal Medicine');
  });

  it('does not merge HCPs that only share a specialty', async () => {
    await request(app)
      .post('/api/import/hcps')
      .set('X-Auth-Token', adminToken)
      .send({
        records: [
          {
            name: 'Dr. Owen Hunt',
            areaTag: 'Seattle Grace - Trauma',
            specialty: 'Cardiology',
          },
        ],
      })
      .expect(200);

    const secondResponse = await request(app)
      .post('/api/import/hcps')
      .set('X-Auth-Token', adminToken)
      .send({
        records: [
          {
            name: 'Dr. Teddy Altman',
            areaTag: 'Seattle Grace - Cardio',
            specialty: 'Cardiology',
          },
        ],
      })
      .expect(200);

    expect(secondResponse.body).toMatchObject({
      created: 1,
      updated: 0,
      rejected: 0,
      total: 1,
    });

    const all = await Hcp.findAll({ order: [['name', 'ASC']] });
    expect(all).toHaveLength(2);
    expect(all.map(hcp => `${hcp.name}:${hcp.areaTag}`)).toEqual([
      'Dr. Owen Hunt:Seattle Grace - Trauma',
      'Dr. Teddy Altman:Seattle Grace - Cardio',
    ]);
  });

  it('rejects records that are missing required composite key fields', async () => {
    const response = await request(app)
      .post('/api/import/hcps')
      .set('X-Auth-Token', adminToken)
      .send({
        records: [
          {
            name: 'Dr. Arizona Robbins',
            specialty: 'Pediatric Surgery',
          },
          {
            name: 'Dr. Mark Sloan',
            areaTag: 'Seattle Grace - Plastics',
            specialty: 'Plastic Surgery',
          },
        ],
      })
      .expect(200);

    expect(response.body).toMatchObject({
      created: 1,
      updated: 0,
      rejected: 1,
      total: 2,
    });

    const stored = await Hcp.findAll();
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Dr. Mark Sloan');
  });
});
