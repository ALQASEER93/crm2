const { initDb, sequelize } = require('../db');
const { Role } = require('../models');

const roles = [
  { slug: 'admin', name: 'Administrator', description: 'System administrator with full access.' },
  {
    slug: 'sales-marketing-manager',
    name: 'Sales & Marketing Manager',
    description: 'Regional manager with visibility across teams.',
  },
  {
    slug: 'medical-sales-rep',
    name: 'Medical Sales Representative',
    description: 'Handles HCP and medical visits with access to their own accounts.',
  },
  {
    slug: 'salesman',
    name: 'Salesman',
    description: 'Retail-focused sales covering pharmacies and trade customers.',
  },
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
