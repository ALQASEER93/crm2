const bcrypt = require('bcryptjs');
const Role = require('../models/role');
const User = require('../models/user');

const DEFAULT_ROLES = [
  { slug: 'admin', name: 'Administrator' },
  { slug: 'manager', name: 'Manager' },
  { slug: 'rep', name: 'Sales Representative' },
];

const DEFAULT_USERS = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
  },
  {
    name: 'Manager User',
    email: 'manager@example.com',
    password: 'password',
    role: 'manager',
  },
  {
    name: 'Sales Rep',
    email: 'rep@example.com',
    password: 'password',
    role: 'rep',
  },
];

const seedUsersAndRoles = async () => {
  const rolesBySlug = {};

  for (const roleData of DEFAULT_ROLES) {
    const [role] = await Role.findOrCreate({
      where: { slug: roleData.slug },
      defaults: roleData,
    });
    rolesBySlug[role.slug] = role;
  }

  for (const userData of DEFAULT_USERS) {
    const role = rolesBySlug[userData.role];
    if (!role) {
      // Should never happen, but guard against inconsistent seed config.
      // eslint-disable-next-line no-continue
      continue;
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);
    const [user, created] = await User.findOrCreate({
      where: { email: userData.email },
      defaults: {
        name: userData.name,
        email: userData.email,
        passwordHash,
        roleId: role.id,
      },
    });

    if (!created) {
      const updates = {
        name: userData.name,
        roleId: role.id,
      };

      if (user.passwordHash !== passwordHash) {
        updates.passwordHash = passwordHash;
      }

      await user.update(updates);
    }
  }
};

module.exports = { seedUsersAndRoles };
const { seedVisits } = require('../scripts/seedVisits');

module.exports = seedVisits;

if (require.main === module) {
  seedVisits()
    .then(result => {
      console.log(`Seeded visits. ${result.inserted} new row(s) added.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to seed visits:', error);
      process.exit(1);
    });
}
