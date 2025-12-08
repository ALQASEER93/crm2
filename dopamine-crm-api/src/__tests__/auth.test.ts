// Set up environment variables for testing AT THE VERY TOP
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes';
import bcrypt from 'bcrypt';
import { query } from '../config/db';


jest.mock('../config/db');
jest.mock('bcrypt');

const app = express();
app.use(express.json());
app.use('/api', authRoutes);

describe('Auth Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should login a user with correct credentials', async () => {
    (query as jest.Mock).mockResolvedValue({
      rows: [{ id: 1, email: 'test@example.com', password_hash: 'hashedpassword', role_id: 1 }],
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should not login with incorrect credentials', async () => {
    (query as jest.Mock).mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toEqual(401);
  });
});
