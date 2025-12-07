const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Dopamine CRM API is running!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
