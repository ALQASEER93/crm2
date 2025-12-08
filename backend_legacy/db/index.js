require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Sequelize } = require('sequelize');

const SQLITE_ERROR_CODES = new Set(['SQLITE_IOERR', 'SQLITE_CANTOPEN']);

const ensureDirectory = filePath => {
  if (!filePath || filePath === ':memory:' || filePath === undefined) {
    return;
  }

  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const resolveStoragePath = storage => {
  if (!storage || storage === ':memory:') {
    return storage;
  }

  // Keep behavior consistent but avoid relative path surprises.
  const resolved = path.isAbsolute(storage) ? storage : path.resolve(storage);
  ensureDirectory(resolved);
  return resolved;
};

const buildSqliteConfig = storage => {
  const defaultPath =
    process.env.NODE_ENV === 'test'
      ? ':memory:'
      : path.join(__dirname, '..', '..', 'data', 'database.sqlite');
  const storagePath = resolveStoragePath(storage || process.env.SQLITE_STORAGE || defaultPath);

  return {
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
  };
};

const buildSequelizeInstance = storage => {
  if (process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, { logging: false });
  }

  return new Sequelize(buildSqliteConfig(storage));
};

let sequelize = buildSequelizeInstance();
const db = { sequelize };
module.exports = db;

let models;
const resetModelCache = () => {
  [
    '../models/role',
    '../models/user',
    '../models/hcp',
    '../models/salesRep',
    '../models/territory',
    '../models/visit',
    '../models/pharmacy',
    '../models',
  ].forEach(modulePath => {
    const resolved = require.resolve(modulePath);
    delete require.cache[resolved];
  });
  models = undefined;
};

const loadModels = () => {
  require('../models/role');
  require('../models/user');
  require('../models/hcp');
  if (!models) {
    models = require('../models');
  }

  return models;
};

const { seedUsersAndRoles } = require('./seed');

const setSequelizeInstance = instance => {
  sequelize = instance;
  db.sequelize = instance;
  module.exports.sequelize = instance;
  resetModelCache();
  loadModels();
};

const shouldFallbackToTemp = error =>
  SQLITE_ERROR_CODES.has(error?.code) || SQLITE_ERROR_CODES.has(error?.parent?.code);

const getFallbackStorage = () => {
  const tmpDir = path.join(os.tmpdir(), 'crm2');
  ensureDirectory(tmpDir);
  return path.join(tmpDir, 'database.sqlite');
};

let initializationPromise;
const initDb = async () => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        setSequelizeInstance(sequelize);
        await sequelize.authenticate();
        await sequelize.sync();
        await seedUsersAndRoles();
      } catch (error) {
        if (shouldFallbackToTemp(error)) {
          const fallbackStorage = getFallbackStorage();
          console.warn(
            `SQLite storage unavailable at "${sequelize?.options?.storage}". Falling back to "${fallbackStorage}".`,
          );
          const fallbackSequelize = buildSequelizeInstance(fallbackStorage);
          setSequelizeInstance(fallbackSequelize);
          await sequelize.authenticate();
          await sequelize.sync();
          await seedUsersAndRoles();
        } else {
          throw error;
        }
      }
    })();
  }

  return initializationPromise;
};

const resetDatabase = async () => {
  loadModels();
  await sequelize.sync({ force: true });
  await seedUsersAndRoles();
};

db.initDb = initDb;
db.resetDatabase = resetDatabase;

module.exports = {
  sequelize,
  initDb,
  resetDatabase,
  loadModels,
};
