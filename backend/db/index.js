const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const ensureDirectory = filePath => {
  if (!filePath || filePath === ':memory:' || filePath === undefined) {
    return;
  }

  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const getSequelizeInstance = () => {
  if (process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      logging: false,
    });
  }

  const storage = process.env.SQLITE_STORAGE || (process.env.NODE_ENV === 'test' ? ':memory:' : path.join(__dirname, '..', '..', 'data', 'database.sqlite'));
  ensureDirectory(storage);

  return new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
  });
};

const sequelize = getSequelizeInstance();

let models;
const loadModels = () => {
  if (!models) {
    models = require('../models');
  }

  return models;
};

let initializationPromise;
const initDb = async () => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      loadModels();
      await sequelize.authenticate();
      await sequelize.sync();
    })();
  }

  return initializationPromise;
};

const resetDatabase = async () => {
  loadModels();
  await sequelize.sync({ force: true });
};

module.exports = {
  sequelize,
  initDb,
  resetDatabase,
  loadModels,
};
