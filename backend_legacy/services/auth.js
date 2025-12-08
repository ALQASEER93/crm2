const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Role = require('../models/role');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

class AuthenticationError extends Error {}

const serializeUser = user => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role
    ? {
        id: user.role.id,
        name: user.role.name,
        slug: user.role.slug,
      }
    : null,
});

const issueToken = user => {
  const payload = {
    sub: user.id,
    role: user.role?.slug,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    jwtid: crypto.randomBytes(8).toString('hex'),
  });
};

const refreshToken = async token => {
  const user = await verifyToken(token);
  const newToken = issueToken(user);
  return { token: newToken, user };
};

const authenticate = async (email, password) => {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new AuthenticationError('Invalid email or password.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new AuthenticationError('Invalid email or password.');
  }

  const user = await User.findOne({
    where: { email: normalizedEmail },
    include: [{ model: Role, as: 'role' }],
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password.');
  }

  if (user.isActive === false) {
    throw new AuthenticationError('Invalid email or password.');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid email or password.');
  }

  const serializedUser = serializeUser(user);
  const token = issueToken(serializedUser);

  return { token, user: serializedUser };
};

const verifyToken = async token => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.sub, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || user.isActive === false) {
      throw new AuthenticationError('Invalid authentication token.');
    }

    return serializeUser(user);
  } catch (error) {
    throw new AuthenticationError('Invalid authentication token.');
  }
};

module.exports = {
  authenticate,
  issueToken,
  verifyToken,
  refreshToken,
  AuthenticationError,
};
