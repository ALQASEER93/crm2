const { fn, col } = require('sequelize');
const { Visit } = require('../models');
const { buildWhereClause } = require('./visits');

const mapFilters = params => {
  const filters = {};

  if (params.dateFrom) {
    filters.dateFrom = params.dateFrom;
  }

  if (params.dateTo) {
    filters.dateTo = params.dateTo;
  }

  if (params.repId) {
    filters.repId = params.repId;
  }

  if (params.hcpId) {
    filters.hcpId = params.hcpId;
  }

  return filters;
};

const formatNumber = value => Number.parseInt(value, 10) || 0;

const fetchVisitsPerSalesRepPerDay = async params => {
  const filters = mapFilters(params);
  const where = buildWhereClause(filters);

  const rows = await Visit.findAll({
    attributes: [
      ['rep_id', 'salesRepId'],
      ['visit_date', 'date'],
      [fn('COUNT', col('Visit.id')), 'count'],
    ],
    where,
    group: ['rep_id', 'visit_date'],
    order: [
      ['visit_date', 'ASC'],
      ['rep_id', 'ASC'],
    ],
    raw: true,
  });

  return rows.map(row => ({
    salesRepId: row.salesRepId,
    date: row.date,
    count: formatNumber(row.count),
  }));
};

const fetchVisitsPerHcp = async params => {
  const filters = mapFilters(params);
  const where = buildWhereClause(filters);

  const rows = await Visit.findAll({
    attributes: [
      ['hcp_id', 'hcpId'],
      [fn('COUNT', col('Visit.id')), 'count'],
    ],
    where,
    group: ['hcp_id'],
    order: [['hcp_id', 'ASC']],
    raw: true,
  });

  return rows.map(row => ({
    hcpId: row.hcpId,
    count: formatNumber(row.count),
  }));
};

const getVisitsReport = async params => {
  const [bySalesRepPerDay, byHcp] = await Promise.all([
    fetchVisitsPerSalesRepPerDay(params),
    fetchVisitsPerHcp(params),
  ]);

  return {
    bySalesRepPerDay,
    byHcp,
  };
};

module.exports = {
  getVisitsReport,
};
