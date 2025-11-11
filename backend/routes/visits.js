const express = require('express');
const Visit = require('../models/visit');
const {
  listVisits,
  summarizeVisits,
  exportVisits,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} = require('../services/visits');

const router = express.Router();

const normalizeToArray = value => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value.split(',');
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
};

const parseIntegerFilters = (rawValue, fieldName, errors) => {
  const values = normalizeToArray(rawValue);
  const parsed = [];

  for (const value of values) {
    const trimmed = String(value).trim();
    if (!trimmed) {
      continue;
    }

    const parsedValue = Number.parseInt(trimmed, 10);
    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      errors.push(`${fieldName} must contain integer identifiers.`);
      continue;
    }

    parsed.push(parsedValue);
  }

  return parsed;
};

const parseStatuses = (rawValue, errors) => {
  const values = normalizeToArray(rawValue).map(value => String(value).trim()).filter(Boolean);
  for (const status of values) {
    if (!Visit.ALLOWED_STATUSES.includes(status)) {
      errors.push(`status must be one of: ${Visit.ALLOWED_STATUSES.join(', ')}`);
      break;
    }
  }

  return values;
};

const isValidDate = value => {
  if (typeof value !== 'string') {
    return false;
  }

  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
};

const parseListQuery = query => {
  const errors = [];
  const params = {};

  if (query.page !== undefined) {
    const parsed = Number.parseInt(query.page, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      errors.push('page must be a positive integer.');
    } else {
      params.page = parsed;
    }
  } else {
    params.page = DEFAULT_PAGE;
  }

  if (query.pageSize !== undefined) {
    const parsed = Number.parseInt(query.pageSize, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      errors.push('pageSize must be a positive integer.');
    } else if (parsed > MAX_PAGE_SIZE) {
      errors.push(`pageSize must be less than or equal to ${MAX_PAGE_SIZE}.`);
    } else {
      params.pageSize = parsed;
    }
  } else {
    params.pageSize = DEFAULT_PAGE_SIZE;
  }

  if (query.sortBy !== undefined) {
    if (['visitDate', 'status', 'durationMinutes', 'hcpName', 'repName', 'territoryName'].includes(query.sortBy)) {
      params.sortBy = query.sortBy;
    } else {
      errors.push('sortBy contains an unsupported field.');
    }
  }

  if (query.sortDirection !== undefined) {
    const normalized = String(query.sortDirection).toLowerCase();
    if (normalized === 'asc' || normalized === 'desc') {
      params.sortDirection = normalized;
    } else {
      errors.push('sortDirection must be either "asc" or "desc".');
    }
  }

  if (query.status !== undefined) {
    const statuses = parseStatuses(query.status, errors);
    if (statuses.length) {
      params.status = statuses;
    }
  }

  if (query.repId !== undefined) {
    const reps = parseIntegerFilters(query.repId, 'repId', errors);
    if (reps.length) {
      params.repId = reps;
    }
  }

  if (query.hcpId !== undefined) {
    const hcps = parseIntegerFilters(query.hcpId, 'hcpId', errors);
    if (hcps.length) {
      params.hcpId = hcps;
    }
  }

  if (query.territoryId !== undefined) {
    const territories = parseIntegerFilters(query.territoryId, 'territoryId', errors);
    if (territories.length) {
      params.territoryId = territories;
    }
  }

  if (query.dateFrom !== undefined) {
    if (!isValidDate(query.dateFrom)) {
      errors.push('dateFrom must be a valid ISO-8601 date string.');
    } else {
      params.dateFrom = new Date(query.dateFrom).toISOString().slice(0, 10);
    }
  }

  if (query.dateTo !== undefined) {
    if (!isValidDate(query.dateTo)) {
      errors.push('dateTo must be a valid ISO-8601 date string.');
    } else {
      params.dateTo = new Date(query.dateTo).toISOString().slice(0, 10);
    }
  }

  if (params.dateFrom && params.dateTo && params.dateFrom > params.dateTo) {
    errors.push('dateFrom must be on or before dateTo.');
  }

  if (query.q !== undefined) {
    if (typeof query.q !== 'string') {
      errors.push('q must be a string.');
    } else {
      const trimmed = query.q.trim();
      if (trimmed) {
        params.q = trimmed;
      }
    }
  }

  return { params, errors };
};

router.get('/', async (req, res, next) => {
  const { params, errors } = parseListQuery(req.query || {});
  if (errors.length) {
    return res.status(400).json({ message: 'Invalid query parameters.', errors });
  }

  try {
    const result = await listVisits(params);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/summary', async (req, res, next) => {
  const { params, errors } = parseListQuery(req.query || {});
  if (errors.length) {
    return res.status(400).json({ message: 'Invalid query parameters.', errors });
  }

  try {
    const summary = await summarizeVisits(params);
    res.json({ data: summary });
  } catch (error) {
    next(error);
  }
});

router.get('/export', async (req, res, next) => {
  const { params, errors } = parseListQuery(req.query || {});
  if (errors.length) {
    return res.status(400).json({ message: 'Invalid query parameters.', errors });
  }

  try {
    const csv = await exportVisits(params);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="visits.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
