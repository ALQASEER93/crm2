const { initDb, sequelize } = require('../db');
const { Role } = require('../models');

const roles = [
  { slug: 'admin', name: 'Administrator', description: 'System administrator with full access.' },
  { slug: 'manager', name: 'Sales manager', description: 'Regional manager with visibility across teams.' },
  { slug: 'rep', name: 'Sales representative', description: 'Sales representative with access to their own visits.' },
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
