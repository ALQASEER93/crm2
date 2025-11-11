const bcrypt = require('bcryptjs');

const { initDb, sequelize } = require('../db');
const { User, Role } = require('../models');

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    roleName: 'admin',
  },
  {
    name: 'Regional Manager',
    email: 'manager@example.com',
    password: 'password',
    roleName: 'manager',
  },
  {
    name: 'Meredith Grey',
    email: 'meredith.grey@example.com',
    password: 'password',
    roleName: 'rep',
  },
  {
    name: 'Derek Shepherd',
    email: 'derek.shepherd@example.com',
    password: 'password',
    roleName: 'rep',
  },
  {
    name: 'Miranda Bailey',
    email: 'miranda.bailey@example.com',
    password: 'password',
    roleName: 'rep',
  },
];

const seedUsers = async () => {
  await initDb();
  const transaction = await sequelize.transaction();

  try {
    const roleCache = new Map();

    const getRole = async roleName => {
      if (!roleCache.has(roleName)) {
        const role = await Role.findOne({ where: { name: roleName }, transaction });

        if (!role) {
          throw new Error(`Role \"${roleName}\" has not been seeded yet.`);
        }

        roleCache.set(roleName, role);
      }

      return roleCache.get(roleName);
    };

    for (const user of users) {
      const role = await getRole(user.roleName);
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
