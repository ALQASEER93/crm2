import { query } from '../config/db';
import { User } from '../models/user.model'; // Assuming a User model/interface exists

export const userRepository = {
  async create(user: Partial<User>): Promise<User> {
    const { name, email, password_hash, role_id, territory_id, status } = user;
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role_id, territory_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, password_hash, role_id, territory_id, status]
    );
    return result.rows[0];
  },

  async findAll(): Promise<User[]> {
    const result = await query('SELECT id, name, email, role_id, territory_id, status FROM users');
    return result.rows;
  },

  async findById(id: number): Promise<User | null> {
    const result = await query('SELECT id, name, email, role_id, territory_id, status FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async update(id: number, user: Partial<User>): Promise<User | null> {
    const { name, email, role_id, territory_id, status } = user;
    const result = await query(
      'UPDATE users SET name = $1, email = $2, role_id = $3, territory_id = $4, status = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [name, email, role_id, territory_id, status, id]
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<User | null> {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },
};
