// backend/db/seed.js
const bcrypt = require('bcryptjs');
const { Role, User } = require('../models');

const DEFAULT_ROLES = [
  { slug: 'admin', name: 'Administrator', description: 'Full access' },
  { slug: 'manager', name: 'Sales manager', description: 'Manages reps' },
  { slug: 'rep', name: 'Sales representative', description: 'Field rep' },
];

const DEFAULT_USERS = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
  },
  {
    name: 'Sales Manager',
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

async function seedUsersAndRoles() {
  // نتأكد أن الموديلات متحمّلة
  if (!Role || !User) {
    throw new Error('Role or User model not loaded');
  }

  const rolesBySlug = {};

  // 1) زرع/تحديث الأدوار
  for (const roleData of DEFAULT_ROLES) {
    const [role] = await Role.upsert(
      {
        slug: roleData.slug,
        name: roleData.name,
        description: roleData.description || null,
      },
      { returning: true },
    );
    rolesBySlug[role.slug] = role;
  }

  // 2) زرع/تحديث المستخدمين
  for (const userData of DEFAULT_USERS) {
    const role = rolesBySlug[userData.role];
    if (!role) continue;

    const passwordHash = await bcrypt.hash(userData.password, 10);

    await User.findOrCreate({
      where: { email: userData.email },
      defaults: {
        name: userData.name,
        email: userData.email,
        passwordHash,
        roleId: role.id,
      },
    });
  }

  console.log('✅ Seeded default roles & users');
}

// مهم: نُصدّرها كـ property بهذا الشكل تماماً
module.exports = { seedUsersAndRoles };
