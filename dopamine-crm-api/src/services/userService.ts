import { userRepository } from '../repositories/userRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

export const authService = {
  async login(email: string, password: string): Promise<string | null> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    // @ts-ignore
    const token = jwt.sign(
      { userId: user.id, roleId: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return token;
  },
};

export const userService = {
    async createUser(userData: Partial<User>): Promise<User> {
        const { password } = userData as any;
        const password_hash = await bcrypt.hash(password, 10);
        return userRepository.create({ ...userData, password_hash });
    },
    async getAllUsers(): Promise<User[]> {
        return userRepository.findAll();
    },
    async getUserById(id: number): Promise<User | null> {
        return userRepository.findById(id);
    },
    async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
        return userRepository.update(id, userData);
    },
    async deleteUser(id: number): Promise<User | null> {
        return userRepository.delete(id);
    }
}
