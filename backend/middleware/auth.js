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

const ROLE_ALIASES = {
  admin: 'sales_manager',
  'sales-marketing-manager': 'sales_manager',
  'medical-sales-rep': 'sales_rep',
  salesman: 'sales_rep',
};

const canonicalizeRole = slug => {
  if (!slug) {
    return slug;
  }
  return ROLE_ALIASES[slug] || slug;
};

const normalizeRoles = roles => {
  if (!roles) {
    return [];
  }

  return Array.isArray(roles) ? roles : [roles];
};

const hasAnyRole = (user, roles) => {
  if (!user || !user.role || !user.role.slug) {
    return false;
  }

  const allowed = normalizeRoles(roles).map(canonicalizeRole);
  if (!allowed.length) {
    return false;
  }

  return allowed.includes(canonicalizeRole(user.role.slug));
};

const requireAnyRole = roles => (req, res, next) => {
  if (!hasAnyRole(req.user, roles)) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  return next();
};

const requireRole = roles => requireAnyRole(roles);

module.exports = {
  requireAuth,
  requireRole,
  requireAnyRole,
  hasAnyRole,
};
