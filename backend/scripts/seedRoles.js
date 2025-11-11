const { initDb, sequelize } = require('../db');
const { Role } = require('../models');

const roles = [
  { name: 'admin', description: 'System administrator with full access.' },
  { name: 'manager', description: 'Regional manager with visibility across teams.' },
  { name: 'rep', description: 'Sales representative with access to their own visits.' },
];

const seedRoles = async () => {
  await initDb();
  const transaction = await sequelize.transaction();

  try {
    for (const role of roles) {
      await Role.upsert(role, { transaction });
    }

    await transaction.commit();
    return { inserted: roles.length };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

if (require.main === module) {
  seedRoles()
    .then(result => {
      console.log(`Seeded ${result.inserted} roles.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to seed roles:', error);
      process.exit(1);
    });
}

module.exports = { seedRoles, roles };
