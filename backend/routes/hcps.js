const express = require('express');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const Hcp = require('../models/hcp');

const router = express.Router();

const serialize = model => ({
  id: model.id,
  name: model.name,
  areaTag: model.areaTag,
  specialty: model.specialty,
  phone: model.phone,
  email: model.email,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
});

const normalizePayload = payload => ({
  name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
  areaTag: typeof payload.areaTag === 'string' ? payload.areaTag.trim() : payload.areaTag,
  specialty: typeof payload.specialty === 'string' ? payload.specialty.trim() : payload.specialty,
  phone: typeof payload.phone === 'string' ? payload.phone.trim() || null : payload.phone,
  email: typeof payload.email === 'string' ? payload.email.trim().toLowerCase() || null : payload.email,
});

const handleSequelizeError = (error, res) => {
  if (error instanceof UniqueConstraintError) {
    res.status(409).json({ message: 'An HCP with the same name and area tag already exists.' });
    return true;
  }

  if (error instanceof ValidationError) {
    res.status(400).json({ message: error.message });
    return true;
  }

  return false;
};

router.get('/', async (req, res, next) => {
  try {
    const hcps = await Hcp.findAll({ order: [['name', 'ASC']] });
    res.json(hcps.map(serialize));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const hcp = await Hcp.findByPk(req.params.id);
    if (!hcp) {
      return res.status(404).json({ message: 'HCP not found.' });
    }

    res.json(serialize(hcp));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body || {});
    const hcp = await Hcp.create(payload);
    res.status(201).json(serialize(hcp));
  } catch (error) {
    if (!handleSequelizeError(error, res)) {
      next(error);
    }
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const hcp = await Hcp.findByPk(req.params.id);
    if (!hcp) {
      return res.status(404).json({ message: 'HCP not found.' });
    }

    const payload = normalizePayload(req.body || {});
    await hcp.update(payload);
    res.json(serialize(hcp));
  } catch (error) {
    if (!handleSequelizeError(error, res)) {
      next(error);
    }
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const hcp = await Hcp.findByPk(req.params.id);
    if (!hcp) {
      return res.status(404).json({ message: 'HCP not found.' });
    }

    await hcp.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
