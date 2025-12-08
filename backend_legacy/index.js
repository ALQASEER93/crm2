const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const { authenticate, AuthenticationError, refreshToken } = require('./services/auth');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    exposedHeaders: ['X-Auth-Token'],
  }),
);
app.use(express.json());

const buildAuthResponse = (user) => ({
  user,
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

// Authenticates credentials and responds with a JWT via `X-Auth-Token`.
const loginHandler = async (req, res, next) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { token, user } = await authenticate(email, password);
    res.setHeader('X-Auth-Token', token);
    return res.json(buildAuthResponse(user));
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return next(error);
  }
};

const meHandler = (req, res) => {
  return res.json(buildAuthResponse(req.user));
};

const refreshHandler = async (req, res) => {
  const { token, user } = await refreshToken(req.authToken);
  res.setHeader('X-Auth-Token', token);
  return res.json(buildAuthResponse(user));
};

const healthHandler = (_req, res) => {
  res.json({ status: 'ok' });
};

app.post('/api/auth/login', (req, res, next) => {
  Promise.resolve(loginHandler(req, res, next)).catch(next);
});
app.get('/api/auth/me', requireAuth, (req, res) => {
  return meHandler(req, res);
});
app.post('/api/auth/refresh', requireAuth, (req, res, next) => {
  Promise.resolve(refreshHandler(req, res, next)).catch(next);
});
// Health and primary functional routers assume authentication middleware ran above.
app.get('/api/health', healthHandler);

const registerRoutes = () => {
  const hcpsRouter = require('./routes/hcps');
  const importRouter = require('./routes/import');
  const visitsRouter = require('./routes/visits');
  const reportsRouter = require('./routes/reports');
  const pharmaciesRouter = require('./routes/pharmacies');
  const salesRepsRouter = require('./routes/salesReps');
  const territoriesRouter = require('./routes/territories');

  app.use(
    '/api/hcps',
    requireAuth,
    requireRole(['sales_manager', 'sales_rep']),
    hcpsRouter,
  );
  app.use('/api/import', requireAuth, requireRole(['sales_manager']), importRouter);
  app.use('/api/visits', requireAuth, visitsRouter);
  app.use('/api/reports', requireAuth, reportsRouter);
  app.use(
    '/api/pharmacies',
    requireAuth,
    requireRole(['sales_manager', 'sales_rep']),
    pharmaciesRouter,
  );
  app.use('/api/sales-reps', requireAuth, requireRole(['sales_manager', 'sales_rep']), salesRepsRouter);
  app.use('/api/territories', requireAuth, requireRole(['sales_manager', 'sales_rep']), territoriesRouter);
  const usersRouter = require('./routes/users');
  app.use('/api/admin/users', requireAuth, requireRole(['sales_manager', 'admin']), usersRouter);
};

// Initialize the database once; routers can rely on `ready` when needed for testing.
const ready = initDb().then(() => {
  registerRoutes();
});

if (require.main === module) {
  ready
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(error => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
}

module.exports = {
  app,
  loginHandler,
  healthHandler,
  ready,
};
