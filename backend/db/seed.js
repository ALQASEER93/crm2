// backend/db/seed.js
const bcrypt = require("bcryptjs");

const DEFAULT_ROLES = [
  {
    slug: "sales_manager",
    name: "Sales Manager",
    description: "Oversees the entire field team.",
  },
  {
    slug: "sales_rep",
    name: "Sales Representative",
    description: "Handles assigned HCP and pharmacy accounts.",
  },
];

const ROLE_ALIASES = {
  admin: "sales_manager",
  "sales-marketing-manager": "sales_manager",
  "medical-sales-rep": "sales_rep",
  salesman: "sales_rep",
};

const DEFAULT_USERS = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "password",
    role: "sales_manager",
  },
  {
    name: "Medical Rep",
    email: "rep@example.com",
    password: "password",
    role: "sales_rep",
  },
];

async function seedUsersAndRoles() {
  const { Role, User } = require("../models");
  if (!Role || !User) {
    throw new Error("Role or User model not loaded");
  }

  const rolesBySlug = {};

  for (const roleData of DEFAULT_ROLES) {
    const [role] = await Role.upsert(
      {
        slug: roleData.slug,
        name: roleData.name,
        description: roleData.description || null,
      },
      { returning: true }
    );
    rolesBySlug[role.slug] = role;
  }

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

  for (const [alias, canonicalSlug] of Object.entries(ROLE_ALIASES)) {
    const canonicalRole = rolesBySlug[canonicalSlug];
    if (!canonicalRole) {
      continue;
    }

    const legacyRole = await Role.findOne({ where: { slug: alias } });
    if (legacyRole) {
      await User.update(
        { roleId: canonicalRole.id },
        { where: { roleId: legacyRole.id } }
      );
      await legacyRole.destroy();
    }
  }

  console.log("Seeded default roles & users");
}

module.exports = { seedUsersAndRoles };
