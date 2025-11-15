const bcrypt = require('bcryptjs');

const { initDb, sequelize } = require('../db');
const { User, Role } = require('../models');

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    roleSlug: 'admin',
  },
  {
    name: 'Regional Manager',
    email: 'manager@example.com',
    password: 'password',
    roleSlug: 'sales-marketing-manager',
  },
  {
    name: 'Meredith Grey',
    email: 'meredith.grey@example.com',
    password: 'password',
    roleSlug: 'medical-sales-rep',
  },
  {
    name: 'Derek Shepherd',
    email: 'derek.shepherd@example.com',
    password: 'password',
    roleSlug: 'medical-sales-rep',
  },
  {
    name: 'Miranda Bailey',
    email: 'miranda.bailey@example.com',
    password: 'password',
    roleSlug: 'medical-sales-rep',
  },
  {
    name: 'Retail Salesman',
    email: 'salesman@example.com',
    password: 'password',
    roleSlug: 'salesman',
  },
];

const seedUsers = async () => {
  await initDb();
  const transaction = await sequelize.transaction();

  try {
    const roleCache = new Map();

    const getRole = async roleSlug => {
      if (!roleCache.has(roleSlug)) {
        const role = await Role.findOne({ where: { slug: roleSlug }, transaction });

        if (!role) {
          throw new Error(`Role "${roleSlug}" has not been seeded yet.`);
        }

        roleCache.set(roleSlug, role);
      }

      return roleCache.get(roleSlug);
    };

    for (const user of users) {
      const role = await getRole(user.roleSlug);
      const passwordHash = await bcrypt.hash(user.password, 10);
      const payload = {
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash,
        roleId: role.id,
      };

      await User.upsert(payload, { transaction });
    }

    await transaction.commit();
    return { inserted: users.length };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

if (require.main === module) {
  seedUsers()
    .then(result => {
      console.log(`Seeded ${result.inserted} users.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to seed users:', error);
      process.exit(1);
    });
}

module.exports = { seedUsers, users };
