const express = require('express');
const { getVisitsReport } = require('../services/reports');
const SalesRep = require('../models/salesRep');

const router = express.Router();

const REP_SCOPED_ROLES = new Set(['medical-sales-rep', 'salesman']);

const isValidDate = value => {
  if (typeof value !== 'string') {
    return false;
  }

  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
};

const toDateOnly = value => new Date(value).toISOString().slice(0, 10);

const parseInteger = (value, fieldName, errors) => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    errors.push(`${fieldName} must be a positive integer.`);
    return undefined;
  }

  return parsed;
};

const resolveRepForUser = async user => {
  if (!user?.role || !REP_SCOPED_ROLES.has(user.role.slug)) {
    return null;
  }

  const rep = await SalesRep.findOne({ where: { email: user.email } });
  if (!rep) {
    throw new Error('REP_PROFILE_NOT_FOUND');
  }

  return rep;
};

const parseVisitsReportQuery = query => {
  const errors = [];
  const params = {};

  if (!query.from || !isValidDate(query.from)) {
    errors.push('from is required and must be a valid ISO-8601 date string.');
  } else {
    params.dateFrom = toDateOnly(query.from);
  }

  if (!query.to || !isValidDate(query.to)) {
    errors.push('to is required and must be a valid ISO-8601 date string.');
  } else {
    params.dateTo = toDateOnly(query.to);
  }

  if (params.dateFrom && params.dateTo && params.dateFrom > params.dateTo) {
    errors.push('from must be on or before to.');
  }

  const salesRepId = parseInteger(query.salesRepId, 'salesRepId', errors);
  if (salesRepId) {
    params.repId = salesRepId;
  }

  const hcpId = parseInteger(query.hcpId, 'hcpId', errors);
  if (hcpId) {
    params.hcpId = hcpId;
  }

  return { params, errors };
};

router.get('/visits', async (req, res, next) => {
  const { params, errors } = parseVisitsReportQuery(req.query || {});
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
    const data = await getVisitsReport(params);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
