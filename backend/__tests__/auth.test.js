const request = require('supertest');
const { app } = require('..');

describe('POST /api/auth/login', () => {
  it('authenticates valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
      .expect(200);

    expect(response.body).toEqual({
      id: 1,
      email: 'admin@example.com',
      name: 'Admin User',
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
  });
});

describe('GET /api/health', () => {
  it('returns an ok status', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
