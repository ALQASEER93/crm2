const express = require('express');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// In-memory user seed. Passwords are stored as hashes to avoid leaking
// credentials when the data store is inspected or logged.
const users = [
  {
    id: 1,
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('password', 10),
    name: 'Admin User'
  }
];

const loginHandler = (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  return res.json({ id: user.id, email: user.email, name: user.name });
};

const healthHandler = (_req, res) => {
  res.json({ status: 'ok' });
};

app.post('/api/auth/login', loginHandler);
app.get('/api/health', healthHandler);

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = {
  app,
  loginHandler,
  healthHandler
};

