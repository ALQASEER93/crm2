const request = require('supertest');
const { app, ready } = require('..');
const { resetDatabase } = require('../db');
const { seedRoles } = require('../scripts/seedRoles');
const { seedUsers } = require('../scripts/seedUsers');

const loginAsAdmin = async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'password' })
    .expect(200);

  return response.headers['x-auth-token'];
};

const expectAuthPayload = body => {
  expect(body).toEqual({
    user: {
      id: expect.any(Number),
      email: 'admin@example.com',
      name: 'Admin User',
      role: {
        id: expect.any(Number),
        name: 'Sales Manager',
        slug: 'sales_manager',
      },
    },
    id: expect.any(Number),
    email: 'admin@example.com',
    name: 'Admin User',
    role: { id: expect.any(Number), name: 'Sales Manager', slug: 'sales_manager' },
  });
};

beforeAll(async () => {
  await ready;
});

beforeEach(async () => {
  await resetDatabase();
  await seedRoles();
  await seedUsers();
});

describe('POST /api/auth/login', () => {
  it('authenticates valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
      .expect(200);

    expect(response.headers['x-auth-token']).toBeTruthy();
    expect(response.body).toEqual({
      user: {
        id: expect.any(Number),
        email: 'admin@example.com',
        name: 'Admin User',
        role: {
          id: expect.any(Number),
          name: 'Sales Manager',
          slug: 'sales_manager',
        },
      },
      id: expect.any(Number),
      email: 'admin@example.com',
      name: 'Admin User',
      role: { id: expect.any(Number), name: 'Sales Manager', slug: 'sales_manager' },
    });
  });

  it('rejects missing credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(response.body).toEqual({ message: 'Email and password are required.' });
  });

  it('rejects invalid credentials without revealing which field failed', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'wrong' })
      .expect(401);

    expect(response.body).toEqual({ message: 'Invalid email or password.' });
    expect(response.headers['x-auth-token']).toBeUndefined();
  });
});

describe('GET /api/health', () => {
  it('returns an ok status', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('Authenticated auth endpoints', () => {
  it('returns the current user on /api/auth/me', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/auth/me')
      .set('X-Auth-Token', token)
      .expect(200);

    expectAuthPayload(response.body);
  });

  it('refreshes the token and returns the current user', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('X-Auth-Token', token)
      .expect(200);

    expect(response.headers['x-auth-token']).toBeTruthy();
    expect(response.headers['x-auth-token']).not.toEqual(token);
    expectAuthPayload(response.body);
  });
});
