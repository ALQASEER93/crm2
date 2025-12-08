const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAuth, requireRole } = require('../middleware/auth');
const { User, Role, SalesRep, Territory, UserTerritory } = require('../models');

const router = express.Router();

const USER_TYPE_ROLE_MAP = {
  admin: 'sales_manager',
  manager: 'sales_manager',
  medical_rep: 'sales_rep',
  sales_rep: 'sales_rep',
};

const serializeUser = user => {
  const roleSlug = user.role?.slug || null;
  let roleLabel = 'User';
  if (roleSlug === 'sales_manager') {
    roleLabel = 'Manager';
  } else if (roleSlug === 'sales_rep') {
    roleLabel = 'Sales Rep';
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive !== false,
    role: user.role
      ? { id: user.role.id, name: user.role.name, slug: user.role.slug, label: roleLabel }
      : null,
    salesRep: user.salesRep
      ? {
          id: user.salesRep.id,
          name: user.salesRep.name,
          email: user.salesRep.email,
          territoryId: user.salesRep.territoryId || null,
          territoryName: user.salesRep.territory ? user.salesRep.territory.name : null,
          repType: user.salesRep.repType || 'sales_rep',
        }
      : null,
  };
};

const loadRoleByUserType = async userType => {
  const roleSlug = USER_TYPE_ROLE_MAP[userType];
  if (!roleSlug) {
    return null;
  }
  const role = await Role.findOne({ where: { slug: roleSlug } });
  return role;
};

const ensureSalesRepProfile = async (user, { territoryId, userType }) => {
  const isRepType = userType === 'medical_rep' || userType === 'sales_rep';
  if (!isRepType) {
    return null;
  }

  const repType = userType === 'medical_rep' ? 'medical_rep' : 'sales_rep';
  const [salesRep] = await SalesRep.findOrCreate({
    where: { email: user.email },
    defaults: {
      name: user.name,
      email: user.email,
      territoryId: territoryId || null,
      repType,
    },
  });

  await salesRep.update({
    name: user.name,
    email: user.email,
    territoryId: territoryId || null,
    repType,
  });

  return salesRep;
};

const attachRelations = () => ({
  include: [
    { model: Role, as: 'role' },
    {
      model: SalesRep,
      as: 'salesRep',
      include: [{ model: Territory, as: 'territory' }],
    },
    { model: Territory, as: 'territories', through: { attributes: [] } },
  ],
});

router.use(requireAuth, requireRole(['sales_manager', 'admin']));

router.get('/', async (_req, res, next) => {
  try {
    const users = await User.findAll(attachRelations());
    res.json({ data: users.map(serializeUser) });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const { name, email, password, userType, territoryId } = req.body || {};

  if (!name || !email || !password || !userType) {
    return res.status(400).json({ message: 'name, email, password, and userType are required.' });
  }

  try {
    const role = await loadRoleByUserType(userType);
    if (!role) {
      return res.status(400).json({ message: 'Unsupported userType.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      roleId: role.id,
      isActive: true,
    });

    await ensureSalesRepProfile(user, { territoryId, userType });

    const created = await User.findByPk(user.id, attachRelations());
    return res.status(201).json({ data: serializeUser(created) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'A user with that email already exists.' });
    }
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { name, email, password, userType, territoryId, isActive } = req.body || {};

  try {
    const user = await User.findByPk(id, attachRelations());
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (typeof isActive === 'boolean') {
      updates.isActive = isActive;
      if (user.id === req.user.id && updates.isActive === false) {
        return res.status(400).json({ message: 'You cannot deactivate yourself.' });
      }
    }

    if (userType) {
      const role = await loadRoleByUserType(userType);
      if (!role) {
        return res.status(400).json({ message: 'Unsupported userType.' });
      }
      updates.roleId = role.id;
    }

    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.update(updates);

    if (userType) {
      await ensureSalesRepProfile(user, { territoryId, userType });
    } else if (territoryId !== undefined && user.salesRep) {
      await user.salesRep.update({ territoryId: territoryId || null });
    }

    const refreshed = await User.findByPk(user.id, attachRelations());
    res.json({ data: serializeUser(refreshed) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'A user with that email already exists.' });
    }
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await user.update({ isActive: false });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/territories', async (req, res, next) => {
  const { id } = req.params;
  const territoryIds = Array.isArray(req.body?.territoryIds) ? req.body.territoryIds : [];

  try {
    const user = await User.findByPk(id, { include: [{ model: Territory, as: 'territories' }] });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const territories = await Territory.findAll({ where: { id: territoryIds } });
    await user.setTerritories(territories);

    const refreshed = await User.findByPk(id, attachRelations());
    res.json({ data: serializeUser(refreshed) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
