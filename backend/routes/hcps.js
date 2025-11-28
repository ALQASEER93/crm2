const path = require('path');
const express = require('express');
const { stringify } = require('csv-stringify/sync');
const { Op, ValidationError, UniqueConstraintError, fn, col, where: whereFn } = require('sequelize');
const Hcp = require('../models/hcp');
const { hasAnyRole } = require('../middleware/auth');
const { importHcpsFromFile, importHcps } = require('../services/hcpsImport');

const router = express.Router();

const DATA_FILE = path.join(__dirname, '..', 'data', 'CLIENTLIST-DOPAMINE.xlsx');
const MANAGER_ROLES = ['sales_manager'];
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
// Allow reasonably large pages so the UI can fetch all accounts when needed.
// Response shape:
// {
//   data: [ ...HCP rows... ],
//   pagination: { page, pageSize, total, totalPages }
// }
const MAX_PAGE_SIZE = 5000;

const serialize = model => ({
  id: model.id,
  name: model.name,
  areaTag: model.areaTag,
  specialty: model.specialty,
  city: model.city,
  area: model.area,
  segment: model.segment,
  phone: model.phone,
  mobile: model.mobile,
  email: model.email,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
});

const normalizePayload = payload => ({
  name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
  areaTag: typeof payload.areaTag === 'string' ? payload.areaTag.trim() || null : payload.areaTag,
  specialty: typeof payload.specialty === 'string' ? payload.specialty.trim() || null : payload.specialty,
  city: typeof payload.city === 'string' ? payload.city.trim() || null : payload.city,
  area: typeof payload.area === 'string' ? payload.area.trim() || null : payload.area,
  segment: typeof payload.segment === 'string' ? payload.segment.trim() || null : payload.segment,
  phone: typeof payload.phone === 'string' ? payload.phone.trim() || null : payload.phone,
  mobile: typeof payload.mobile === 'string' ? payload.mobile.trim() || null : payload.mobile,
  email: typeof payload.email === 'string' ? payload.email.trim().toLowerCase() || null : payload.email,
});

const handleSequelizeError = (error, res) => {
  if (error instanceof UniqueConstraintError) {
    res.status(409).json({ message: 'An HCP with the same identity already exists.' });
    return true;
  }

  if (error instanceof ValidationError) {
    res.status(400).json({ message: error.message });
    return true;
  }

  return false;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const buildFilters = query => {
  const where = {};
  const andConditions = [];

  const likeValue = value => ({ [Op.like]: `%${value}%` });

  if (typeof query.city === 'string' && query.city.trim()) {
    where.city = likeValue(query.city.trim());
  }

  if (typeof query.area === 'string' && query.area.trim()) {
    where.area = likeValue(query.area.trim());
  }

  if (typeof query.specialty === 'string' && query.specialty.trim()) {
    where.specialty = likeValue(query.specialty.trim());
  }

  if (typeof query.segment === 'string' && query.segment.trim()) {
    where.segment = likeValue(query.segment.trim());
  }

  if (typeof query.search === 'string') {
    const normalized = query.search.trim().toLowerCase();
    if (normalized) {
      andConditions.push({
        [Op.or]: [
          whereFn(fn('lower', col('name')), { [Op.like]: `%${normalized}%` }),
          whereFn(fn('lower', col('city')), { [Op.like]: `%${normalized}%` }),
          whereFn(fn('lower', col('area')), { [Op.like]: `%${normalized}%` }),
          whereFn(fn('lower', col('specialty')), { [Op.like]: `%${normalized}%` }),
        ],
      });
    }
  }

  if (andConditions.length) {
    where[Op.and] = andConditions;
  }

  return where;
};

const ensureManagerAccess = (req, res) => {
  if (!hasAnyRole(req.user, MANAGER_ROLES)) {
    res.status(403).json({ message: 'Insufficient permissions.' });
    return false;
  }
  return true;
};

router.get('/', async (req, res, next) => {
  const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
  const requestedPageSize = parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
  const where = buildFilters(req.query || {});

  try {
    const { rows, count } = await Hcp.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [
        ['name', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    res.json({
      data: rows.map(serialize),
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export', async (req, res, next) => {
  if (!ensureManagerAccess(req, res)) {
    return;
  }

  try {
    const hcps = await Hcp.findAll({
      order: [
        ['city', 'ASC'],
        ['area', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    const records = hcps.map(serialize);
    const csv = stringify(records, {
      header: true,
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'specialty', header: 'Specialty' },
        { key: 'city', header: 'City' },
        { key: 'area', header: 'Area' },
        { key: 'segment', header: 'Segment' },
        { key: 'phone', header: 'Phone' },
        { key: 'mobile', header: 'Mobile' },
        { key: 'email', header: 'Email' },
        { key: 'areaTag', header: 'Area Tag' },
      ],
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="hcps.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

router.post('/import', async (req, res, next) => {
  if (!ensureManagerAccess(req, res)) {
    return;
  }

  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
    const summary = rows ? await importHcps(rows) : await importHcpsFromFile(DATA_FILE);
    res.json(summary);
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
