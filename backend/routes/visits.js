const express = require('express');
const Visit = require('../models/visit');
const SalesRep = require('../models/salesRep');
const Hcp = require('../models/hcp');
const Territory = require('../models/territory');
const {
  listVisits,
  summarizeVisits,
  exportVisits,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  createVisit,
  updateVisit,
  findVisitById,
  softDeleteVisit,
} = require('../services/visits');

const router = express.Router();

const REP_SCOPED_ROLES = new Set(['medical-sales-rep', 'salesman']);

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

const toDateOnly = value => new Date(value).toISOString().slice(0, 10);

const resolveRepForUser = async user => {
  if (!user?.role || !REP_SCOPED_ROLES.has(user.role.slug)) {
    return null;
  }

  const rep = await SalesRep.findOne({
    where: { email: user.email },
  });

  if (!rep) {
    throw new Error('REP_PROFILE_NOT_FOUND');
  }

  return rep;
};

const parsePositiveInteger = (value, fieldName, errors, { required }) => {
  if (value === undefined) {
    if (required) {
      errors.push(`${fieldName} is required.`);
    }
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    errors.push(`${fieldName} must be a positive integer.`);
    return undefined;
  }

  return parsed;
};

const normalizeNotes = value => {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const validateVisitPayload = (payload, { partial = false, requireRepId = true } = {}) => {
  const errors = [];
  const data = {};
  let hasUpdates = false;

  if (!partial || payload.visitDate !== undefined) {
    if (payload.visitDate === undefined) {
      errors.push('visitDate is required.');
    } else if (!isValidDate(payload.visitDate)) {
      errors.push('visitDate must be a valid ISO-8601 date string.');
    } else {
      data.visitDate = toDateOnly(payload.visitDate);
      hasUpdates = true;
    }
  }

  if (!partial || payload.status !== undefined) {
    if (payload.status === undefined || payload.status === null || !String(payload.status).trim()) {
      errors.push('status is required.');
    } else if (!Visit.ALLOWED_STATUSES.includes(payload.status)) {
      errors.push(`status must be one of: ${Visit.ALLOWED_STATUSES.join(', ')}`);
    } else {
      data.status = payload.status;
      hasUpdates = true;
    }
  }

  if (!partial || payload.durationMinutes !== undefined) {
    if (payload.durationMinutes === undefined || payload.durationMinutes === null) {
      errors.push('durationMinutes is required.');
    } else {
      const parsed = Number.parseInt(payload.durationMinutes, 10);
      if (!Number.isInteger(parsed) || parsed < 0) {
        errors.push('durationMinutes must be a non-negative integer.');
      } else {
        data.durationMinutes = parsed;
        hasUpdates = true;
      }
    }
  }

  const requireRepField = !partial && requireRepId;
  if (!partial || payload.repId !== undefined || !requireRepField) {
    const repId = parsePositiveInteger(payload.repId, 'repId', errors, { required: requireRepField });
    if (repId !== undefined) {
      data.repId = repId;
      hasUpdates = true;
    }
  }

  if (!partial || payload.hcpId !== undefined) {
    const hcpId = parsePositiveInteger(payload.hcpId, 'hcpId', errors, { required: !partial });
    if (hcpId !== undefined) {
      data.hcpId = hcpId;
      hasUpdates = true;
    }
  }

  if (!partial || payload.territoryId !== undefined) {
    const territoryId = parsePositiveInteger(payload.territoryId, 'territoryId', errors, { required: !partial });
    if (territoryId !== undefined) {
      data.territoryId = territoryId;
      hasUpdates = true;
    }
  }

  if (payload.notes !== undefined) {
    if (payload.notes !== null && typeof payload.notes !== 'string') {
      errors.push('notes must be a string.');
    } else {
      data.notes = normalizeNotes(payload.notes);
      hasUpdates = true;
    }
  }

  return { data, errors, hasUpdates };
};

const ensureReferencesExist = async data => {
  const errors = [];
  const lookups = [];

  if (data.repId !== undefined) {
    lookups.push(
      SalesRep.findByPk(data.repId).then(rep => {
        if (!rep) {
          errors.push('repId must reference an existing sales rep.');
        }
      }),
    );
  }

  if (data.hcpId !== undefined) {
    lookups.push(
      Hcp.findByPk(data.hcpId).then(hcp => {
        if (!hcp) {
          errors.push('hcpId must reference an existing HCP.');
        }
      }),
    );
  }

  if (data.territoryId !== undefined) {
    lookups.push(
      Territory.findByPk(data.territoryId).then(territory => {
        if (!territory) {
          errors.push('territoryId must reference an existing territory.');
        }
      }),
    );
  }

  await Promise.all(lookups);
  return errors;
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
      params.dateFrom = toDateOnly(query.dateFrom);
    }
  }

  if (query.dateTo !== undefined) {
    if (!isValidDate(query.dateTo)) {
      errors.push('dateTo must be a valid ISO-8601 date string.');
    } else {
      params.dateTo = toDateOnly(query.dateTo);
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

  let repContext;
  try {
    repContext = await resolveRepForUser(req.user);
  } catch (error) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  if (repContext) {
    params.repId = [repContext.id];
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

  let repContext;
  try {
    repContext = await resolveRepForUser(req.user);
  } catch (error) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  if (repContext) {
    params.repId = [repContext.id];
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

  let repContext;
  try {
    repContext = await resolveRepForUser(req.user);
  } catch (error) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  if (repContext) {
    params.repId = [repContext.id];
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

router.post('/', async (req, res, next) => {
  let repContext;
  try {
    repContext = await resolveRepForUser(req.user);
  } catch (error) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  const { data, errors } = validateVisitPayload(req.body || {}, { partial: false, requireRepId: !repContext });

  if (repContext) {
    if (data.repId !== undefined && data.repId !== repContext.id) {
      errors.push('repId must match the authenticated sales representative.');
    }
    data.repId = repContext.id;
  }

  if (!repContext && data.repId === undefined) {
    errors.push('repId is required.');
  }

  const referenceErrors = await ensureReferencesExist(data);
  errors.push(...referenceErrors);

  if (errors.length) {
    return res.status(400).json({ message: 'Invalid request body.', errors });
  }

  try {
    const created = await createVisit(data);
    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  let repContext;
  try {
    repContext = await resolveRepForUser(req.user);
  } catch (error) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  const visit = await findVisitById(req.params.id);
  if (!visit || visit.isDeleted) {
    return res.status(404).json({ message: 'Visit not found.' });
  }

  if (repContext && visit.repId !== repContext.id) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  const { data, errors, hasUpdates } = validateVisitPayload(req.body || {}, { partial: true });

  if (!hasUpdates) {
    errors.push('At least one field must be provided.');
  }

  if (repContext) {
    if (data.repId !== undefined && data.repId !== repContext.id) {
      errors.push('repId cannot be changed.');
    }
    // Prevent admins from accidentally overwriting when not specifying repId.
    delete data.repId;
  }

  const referenceErrors = await ensureReferencesExist(data);
  errors.push(...referenceErrors);

  if (errors.length) {
    return res.status(400).json({ message: 'Invalid request body.', errors });
  }

  try {
    const updated = await updateVisit(visit, data);
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  let repContext;
  try {
    repContext = await resolveRepForUser(req.user);
  } catch (error) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  const visit = await findVisitById(req.params.id);
  if (!visit || visit.isDeleted) {
    return res.status(404).json({ message: 'Visit not found.' });
  }

  if (repContext && visit.repId !== repContext.id) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  try {
    await softDeleteVisit(visit);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
