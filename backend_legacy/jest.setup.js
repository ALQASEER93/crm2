process.env.SQLITE_STORAGE = ':memory:';

const { initDb, resetDatabase } = require('./db');

beforeAll(async () => {
  await initDb();
});

beforeEach(async () => {
  await resetDatabase();
});
