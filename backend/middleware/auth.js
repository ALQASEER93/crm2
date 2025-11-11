const { verifyToken, AuthenticationError } = require('../services/auth');

const extractToken = req => {
  const headerToken = req.get('X-Auth-Token');
  if (headerToken) {
    return headerToken;
  }

  const authorization = req.get('Authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return null;
};

const requireAuth = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing.' });
  }

  try {
    const user = await verifyToken(token);
    req.user = user;
    req.authToken = token;
    return next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }

    return next(error);
  }
};

const requireRole = allowedRoles => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  if (!allowedRoles.includes(req.user.role.slug)) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  return next();
};

module.exports = {
  requireAuth,
  requireRole,
};
