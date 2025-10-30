const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

let users = [
  { id: 1, email: 'admin@example.com', password: 'password', name: 'Admin User' }
];

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ id: user.id, email: user.email, name: user.name });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

