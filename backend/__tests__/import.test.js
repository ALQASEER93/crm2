const request = require('supertest');
const { app, ready } = require('..');
const Hcp = require('../models/hcp');

describe('HCP import API', () => {
  beforeAll(async () => {
    await ready;
  });

  it('imports new HCP records and exposes them via GET /api/hcps', async () => {
    const payload = {
      records: [
        {
          name: 'Dr. Meredith Grey',
          specialty: 'General Surgery',
          phone: '555-0001',
          email: 'meredith.grey@example.com',
        },
        {
          name: 'Dr. Derek Shepherd',
          specialty: 'Neurosurgery',
          phone: '555-0002',
          email: 'derek.shepherd@example.com',
        },
      ],
    };

    const importResponse = await request(app)
      .post('/api/import/hcps')
      .send(payload)
      .expect(200);

    expect(importResponse.body).toMatchObject({
      created: 2,
      updated: 0,
      rejected: 0,
      total: 2,
    });

    const listResponse = await request(app).get('/api/hcps').expect(200);

    expect(listResponse.body).toEqual([
      expect.objectContaining({
        name: 'Dr. Derek Shepherd',
        specialty: 'Neurosurgery',
        phone: '555-0002',
        email: 'derek.shepherd@example.com',
      }),
      expect.objectContaining({
        name: 'Dr. Meredith Grey',
        specialty: 'General Surgery',
        phone: '555-0001',
        email: 'meredith.grey@example.com',
      }),
    ]);
  });

  it('updates existing records when imported again', async () => {
    await Hcp.bulkCreate([
      {
        name: 'Dr. Miranda Bailey',
        specialty: 'General Surgery',
        phone: '555-1000',
        email: 'miranda.bailey@example.com',
      },
    ]);

    const importResponse = await request(app)
      .post('/api/import/hcps')
      .send({
        records: [
          {
            name: 'Dr. Miranda Bailey',
            specialty: 'General Surgery',
            phone: '555-1111',
            email: 'miranda.bailey@example.com',
          },
          {
            name: 'Dr. Richard Webber',
            specialty: 'General Surgery Chief',
            phone: '555-2222',
            email: 'richard.webber@example.com',
          },
        ],
      })
      .expect(200);

    expect(importResponse.body).toMatchObject({
      created: 1,
      updated: 1,
      rejected: 0,
      total: 2,
    });

    const hcp = await Hcp.findOne({ where: { name: 'Dr. Miranda Bailey' } });
    expect(hcp.phone).toBe('555-1111');
  });

  it('rejects invalid records but continues processing others', async () => {
    const response = await request(app)
      .post('/api/import/hcps')
      .send({
        records: [
          {
            name: 'Dr. Amelia Shepherd',
            specialty: 'Neurosurgery',
            phone: '555-3333',
            email: 'amelia.shepherd@example.com',
          },
          {
            specialty: 'Cardiology',
            phone: '555-4444',
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

    const listResponse = await request(app).get('/api/hcps').expect(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].name).toBe('Dr. Amelia Shepherd');
  });
});
