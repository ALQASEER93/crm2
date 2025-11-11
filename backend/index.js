const express = require('express');
const { initDb } = require('./db');
const { User, Role } = require('./models');
const hcpsRouter = require('./routes/hcps');
const importRouter = require('./routes/import');
const { authenticate, AuthenticationError } = require('./services/auth');
const { requireAuth, requireRole } = require('./middleware/auth');
const visitsRouter = require('./routes/visits');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const loginHandler = async (req, res, next) => {
const loginHandler = async (req, res) => {
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
  const normalizedEmail = email.trim().toLowerCase();
  try {
    await ready;
    const user = await User.findOne({
      where: { email: normalizedEmail },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
    });
  } catch (error) {
    console.error('Failed to authenticate user:', error);
    return res.status(500).json({ message: 'Unable to authenticate user right now.' });
  }
};

const healthHandler = (_req, res) => {
  res.json({ status: 'ok' });
};

app.post('/api/auth/login', (req, res, next) => {
  Promise.resolve(loginHandler(req, res)).catch(next);
});
app.get('/api/health', healthHandler);
app.use('/api/hcps', requireAuth, requireRole(['admin', 'manager', 'rep']), hcpsRouter);
app.use('/api/import', requireAuth, requireRole(['admin']), importRouter);
app.use('/api/visits', requireAuth);
app.use('/api/hcps', hcpsRouter);
app.use('/api/import', importRouter);
app.use('/api/visits', visitsRouter);

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
