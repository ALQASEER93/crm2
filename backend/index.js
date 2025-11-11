const express = require('express');
const { initDb } = require('./db');
const hcpsRouter = require('./routes/hcps');
const importRouter = require('./routes/import');
const { authenticate, AuthenticationError } = require('./services/auth');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const loginHandler = async (req, res, next) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { token, user } = await authenticate(email, password);
    res.setHeader('X-Auth-Token', token);
    return res.json({ user });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return next(error);
  }
};

const healthHandler = (_req, res) => {
  res.json({ status: 'ok' });
};

app.post('/api/auth/login', loginHandler);
app.get('/api/health', healthHandler);
app.use('/api/hcps', requireAuth, requireRole(['admin', 'manager', 'rep']), hcpsRouter);
app.use('/api/import', requireAuth, requireRole(['admin']), importRouter);
app.use('/api/visits', requireAuth);

const ready = initDb();

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
