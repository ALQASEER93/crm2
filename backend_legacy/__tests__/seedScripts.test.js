const bcrypt = require('bcryptjs');

const { sequelize, resetDatabase, initDb } = require('../db');
const { Role, User, Territory, SalesRep, Hcp, Visit } = require('../models');
const { seedRoles } = require('../scripts/seedRoles');
const { seedUsers } = require('../scripts/seedUsers');
const { seedVisits } = require('../scripts/seedVisits');
const sampleData = require('../db/sampleData');

const runAllSeeds = async () => {
  await seedRoles();
  await seedUsers();
  await seedVisits();
};

describe('seed scripts', () => {
  beforeAll(async () => {
    await initDb();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('produce expected counts and are idempotent', async () => {
    await runAllSeeds();

    const countsAfterFirstRun = {
      roles: await Role.count(),
      users: await User.count(),
      territories: await Territory.count(),
      salesReps: await SalesRep.count(),
      hcps: await Hcp.count(),
      visits: await Visit.count(),
    };

    expect(countsAfterFirstRun.roles).toBe(2);
    expect(countsAfterFirstRun.users).toBe(2);
    expect(countsAfterFirstRun.territories).toBe(sampleData.territories.length);
    expect(countsAfterFirstRun.salesReps).toBe(sampleData.salesReps.length);
    expect(countsAfterFirstRun.hcps).toBe(sampleData.hcps.length);
    expect(countsAfterFirstRun.visits).toBe(sampleData.visits.length);

    const adminUser = await User.findOne({ where: { email: 'admin@example.com' }, include: [{ model: Role, as: 'role' }] });
    expect(adminUser).toBeTruthy();
    expect(adminUser.role.slug).toBe('sales_manager');
    expect(await bcrypt.compare('password', adminUser.passwordHash)).toBe(true);

    await runAllSeeds();

    const countsAfterSecondRun = {
      roles: await Role.count(),
      users: await User.count(),
      territories: await Territory.count(),
      salesReps: await SalesRep.count(),
      hcps: await Hcp.count(),
      visits: await Visit.count(),
    };

    expect(countsAfterSecondRun).toEqual(countsAfterFirstRun);
  });
});
