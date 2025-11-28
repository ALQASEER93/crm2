const express = require('express');
const { stringify } = require('csv-stringify/sync');
const {
  getVisitsReport,
  getOverviewReport,
  getRepPerformanceReport,
  getProductPerformanceReport,
  getTerritoryPerformanceReport,
} = require('../services/reports');
const SalesRep = require('../models/salesRep');

const router = express.Router();

const REP_SCOPED_ROLES = new Set(['sales_rep', 'medical-sales-rep', 'salesman']);

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

const applyDefaultDateRange = (query, errors) => {
  const params = {};

  let from = query.from;
  let to = query.to;

  if (!from || !isValidDate(from)) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    from = start.toISOString().slice(0, 10);
  }

  if (!to || !isValidDate(to)) {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    to = end.toISOString().slice(0, 10);
  }

  if (!isValidDate(from)) {
    errors.push('from must be a valid ISO-8601 date string.');
  } else {
    params.dateFrom = toDateOnly(from);
  }

  if (!isValidDate(to)) {
    errors.push('to must be a valid ISO-8601 date string.');
  } else {
    params.dateTo = toDateOnly(to);
  }

  if (params.dateFrom && params.dateTo && params.dateFrom > params.dateTo) {
    errors.push('from must be on or before to.');
  }

  return params;
};

const parseVisitsReportQuery = query => {
  const errors = [];
  const params = {};

  const dateParams = applyDefaultDateRange(query, errors);
  Object.assign(params, dateParams);

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

const parseDateRangeOnly = query => {
  const errors = [];
  const params = applyDefaultDateRange(query, errors);
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

router.get('/overview', async (req, res, next) => {
  const { params, errors } = parseDateRangeOnly(req.query || {});
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
    const data = await getOverviewReport(params);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/rep-performance', async (req, res, next) => {
  const { params, errors } = parseDateRangeOnly(req.query || {});
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
    const data = await getRepPerformanceReport(params);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/rep-performance/export', async (req, res, next) => {
  const { params, errors } = parseDateRangeOnly(req.query || {});
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
    const rows = await getRepPerformanceReport(params);
    const csv = stringify(rows, {
      header: true,
      columns: [
        { key: 'repName', header: 'Rep Name' },
        { key: 'repEmail', header: 'Rep Email' },
        {
          key: 'territoryNames',
          header: 'Territories',
        },
        { key: 'totalVisits', header: 'Total Visits' },
        { key: 'completedVisits', header: 'Completed Visits' },
        { key: 'scheduledVisits', header: 'Scheduled Visits' },
        { key: 'cancelledVisits', header: 'Cancelled Visits' },
        { key: 'uniqueAccounts', header: 'Unique Accounts' },
        { key: 'totalOrderValueJOD', header: 'Total Order Value (JOD)' },
        { key: 'avgOrderValueJOD', header: 'Avg Order Value (JOD)' },
        { key: 'avgRating', header: 'Avg Rating' },
      ],
      cast: {
        string: value => value,
        boolean: value => (value ? 'true' : 'false'),
      },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rep-performance.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

router.get('/product-performance', async (req, res, next) => {
  const { params, errors } = parseDateRangeOnly(req.query || {});
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
    const data = await getProductPerformanceReport(params);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/territory-performance', async (req, res, next) => {
  const { params, errors } = parseDateRangeOnly(req.query || {});
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
    const data = await getTerritoryPerformanceReport(params);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
