const path = require('path');
const express = require('express');
const { stringify } = require('csv-stringify/sync');
const { Op } = require('sequelize');
const Pharmacy = require('../models/pharmacy');
const { hasAnyRole } = require('../middleware/auth');
const { importPharmaciesFromFile, importPharmacies } = require('../services/pharmaciesImport');

const router = express.Router();

const DATA_FILE = path.join(__dirname, '..', 'data', 'CLIENTLIST-DOPAMINE.xlsx');
const MANAGER_ROLES = ['sales_manager'];
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
// Response shape:
// {
//   data: [ ...pharmacy rows... ],
//   pagination: { page, pageSize, total, totalPages }
// }
const MAX_PAGE_SIZE = 5000;

const serialize = model => ({
  id: model.id,
  name: model.name,
  city: model.city,
  area: model.area,
  phone: model.phone,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
});

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const buildFilters = query => {
  const where = {};

  const like = value => ({ [Op.like]: `%${value}%` });

  if (typeof query.city === 'string' && query.city.trim()) {
    where.city = like(query.city.trim());
  }

  if (typeof query.area === 'string' && query.area.trim()) {
    where.area = like(query.area.trim());
  }

  if (typeof query.search === 'string' && query.search.trim()) {
    where.name = like(query.search.trim());
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
  const requestedSize = parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(requestedSize, MAX_PAGE_SIZE);
  const where = buildFilters(req.query || {});

  try {
    const { rows, count } = await Pharmacy.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [
        ['city', 'ASC'],
        ['name', 'ASC'],
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
    const pharmacies = await Pharmacy.findAll({
      order: [
        ['city', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    const records = pharmacies.map(serialize);
    const csv = stringify(records, {
      header: true,
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'city', header: 'City' },
        { key: 'area', header: 'Area' },
        { key: 'phone', header: 'Phone' },
      ],
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="pharmacies.csv"');
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
    const summary = rows ? await importPharmacies(rows) : await importPharmaciesFromFile(DATA_FILE);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
