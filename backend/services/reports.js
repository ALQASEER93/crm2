const { fn, col } = require('sequelize');
const { Visit, SalesRep, Territory } = require('../models');
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

  if (params.territoryId) {
    filters.territoryId = params.territoryId;
  }

  return filters;
};

const formatNumber = value => Number.parseInt(value, 10) || 0;

const getVisitsReport = async params => {
  const filters = mapFilters(params);
  const where = buildWhereClause(filters);

  const rowsPerRepPerDay = await Visit.findAll({
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

  const rowsPerHcp = await Visit.findAll({
    attributes: [
      ['hcp_id', 'hcpId'],
      [fn('COUNT', col('Visit.id')), 'count'],
    ],
    where,
    group: ['hcp_id'],
    order: [['hcp_id', 'ASC']],
    raw: true,
  });

  return {
    bySalesRepPerDay: rowsPerRepPerDay.map(row => ({
      salesRepId: row.salesRepId,
      date: row.date,
      count: formatNumber(row.count),
    })),
    byHcp: rowsPerHcp.map(row => ({
      hcpId: row.hcpId,
      count: formatNumber(row.count),
    })),
  };
};

const getOverviewReport = async params => {
  const filters = mapFilters(params);
  const where = buildWhereClause(filters);

  const visits = await Visit.findAll({
    where,
    attributes: ['id', 'status', 'hcpId', 'pharmacyId', 'orderValueJOD', 'rating'],
    raw: true,
  });

  const from = params.dateFrom;
  const to = params.dateTo;

  const totals = {
    totalVisits: 0,
    completedVisits: 0,
    scheduledVisits: 0,
    cancelledVisits: 0,
  };

  const accountKeys = new Set();
  const hcpKeys = new Set();
  const pharmacyKeys = new Set();

  let orderSum = 0;
  let orderCount = 0;

  let ratingSum = 0;
  let ratingCount = 0;

  visits.forEach(visit => {
    totals.totalVisits += 1;

    if (visit.status === 'completed') totals.completedVisits += 1;
    if (visit.status === 'scheduled') totals.scheduledVisits += 1;
    if (visit.status === 'cancelled') totals.cancelledVisits += 1;

    if (visit.hcpId) {
      const key = `hcp:${visit.hcpId}`;
      accountKeys.add(key);
      hcpKeys.add(key);
    }

    if (visit.pharmacyId) {
      const key = `pharmacy:${visit.pharmacyId}`;
      accountKeys.add(key);
      pharmacyKeys.add(key);
    }

    if (visit.orderValueJOD != null) {
      const value = Number(visit.orderValueJOD);
      if (Number.isFinite(value)) {
        orderSum += value;
        orderCount += 1;
      }
    }

    if (visit.rating != null) {
      const r = Number(visit.rating);
      if (Number.isFinite(r)) {
        ratingSum += r;
        ratingCount += 1;
      }
    }
  });

  const accounts = {
    uniqueAccounts: accountKeys.size,
    hcpCount: hcpKeys.size,
    pharmacyCount: pharmacyKeys.size,
  };

  const orders = {
    totalOrderValueJOD: Number(orderSum.toFixed(2)),
    avgOrderValueJOD: orderCount ? Number((orderSum / orderCount).toFixed(2)) : 0,
  };

  const quality = {
    avgRating: ratingCount ? Number((ratingSum / ratingCount).toFixed(2)) : 0,
  };

  return {
    from,
    to,
    totals,
    accounts,
    orders,
    quality,
  };
};

const getRepPerformanceReport = async params => {
  const filters = mapFilters(params);
  const where = buildWhereClause(filters);

  const [visits, reps, territories] = await Promise.all([
    Visit.findAll({
      where,
      attributes: [
        'repId',
        'status',
        'hcpId',
        'pharmacyId',
        'orderValueJOD',
        'rating',
      ],
      raw: true,
    }),
    SalesRep.findAll({ raw: true }),
    Territory.findAll({ raw: true }),
  ]);

  const repsById = new Map(reps.map(rep => [rep.id, rep]));
  const territoriesById = new Map(territories.map(t => [t.id, t]));

  const metricsByRepId = new Map();

  visits.forEach(visit => {
    if (!visit.repId) return;
    const repId = visit.repId;

    if (!metricsByRepId.has(repId)) {
      metricsByRepId.set(repId, {
        repId,
        totalVisits: 0,
        completedVisits: 0,
        scheduledVisits: 0,
        cancelledVisits: 0,
        uniqueAccounts: new Set(),
        hcpVisits: 0,
        pharmacyVisits: 0,
        orderSum: 0,
        orderCount: 0,
        ratingSum: 0,
        ratingCount: 0,
      });
    }

    const m = metricsByRepId.get(repId);
    m.totalVisits += 1;

    if (visit.status === 'completed') m.completedVisits += 1;
    if (visit.status === 'scheduled') m.scheduledVisits += 1;
    if (visit.status === 'cancelled') m.cancelledVisits += 1;

    if (visit.hcpId) {
      m.hcpVisits += 1;
      m.uniqueAccounts.add(`hcp:${visit.hcpId}`);
    }

    if (visit.pharmacyId) {
      m.pharmacyVisits += 1;
      m.uniqueAccounts.add(`pharmacy:${visit.pharmacyId}`);
    }

    if (visit.orderValueJOD != null) {
      const v = Number(visit.orderValueJOD);
      if (Number.isFinite(v)) {
        m.orderSum += v;
        m.orderCount += 1;
      }
    }

    if (visit.rating != null) {
      const r = Number(visit.rating);
      if (Number.isFinite(r)) {
        m.ratingSum += r;
        m.ratingCount += 1;
      }
    }
  });

  const result = [];

  metricsByRepId.forEach(m => {
    const rep = repsById.get(m.repId) || {};
    const territory = rep.territoryId ? territoriesById.get(rep.territoryId) : null;
    const territoryNames = territory ? [territory.name].filter(Boolean) : [];

    result.push({
      repId: m.repId,
      repName: rep.name || null,
      repEmail: rep.email || null,
      territoryNames,
      totalVisits: m.totalVisits,
      completedVisits: m.completedVisits,
      scheduledVisits: m.scheduledVisits,
      cancelledVisits: m.cancelledVisits,
      uniqueAccounts: m.uniqueAccounts.size,
      hcpVisits: m.hcpVisits,
      pharmacyVisits: m.pharmacyVisits,
      totalOrderValueJOD: Number(m.orderSum.toFixed(2)),
      avgOrderValueJOD: m.orderCount ? Number((m.orderSum / m.orderCount).toFixed(2)) : 0,
      avgRating: m.ratingCount ? Number((m.ratingSum / m.ratingCount).toFixed(2)) : 0,
    });
  });

  return result;
};

const getProductPerformanceReport = async params => {
  const filters = mapFilters(params);
  const where = buildWhereClause(filters);

  const visits = await Visit.findAll({
    where,
    attributes: ['productsJson', 'orderValueJOD'],
    raw: true,
  });

  const metricsByProduct = new Map();

  visits.forEach(visit => {
    if (!visit.productsJson) return;

    let parsed;
    try {
      parsed = JSON.parse(visit.productsJson);
    } catch (_error) {
      return;
    }

    if (!Array.isArray(parsed)) {
      return;
    }

    const seenInVisit = new Set();
    const orderValue = visit.orderValueJOD != null ? Number(visit.orderValueJOD) : null;

    parsed.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const rawName = item.name != null ? String(item.name).trim() : '';
      if (!rawName) return;

      const key = rawName.toLowerCase();
      if (!metricsByProduct.has(key)) {
        metricsByProduct.set(key, {
          productName: rawName,
          visitsCount: 0,
          totalQuantity: 0,
          orderSum: 0,
        });
      }

      const m = metricsByProduct.get(key);

      if (!seenInVisit.has(key)) {
        m.visitsCount += 1;
        seenInVisit.add(key);
        if (orderValue != null && Number.isFinite(orderValue)) {
          m.orderSum += orderValue;
        }
      }

      if (item.quantity != null && item.quantity !== '') {
        const q = Number(item.quantity);
        if (Number.isFinite(q)) {
          m.totalQuantity += q;
        }
      }
    });
  });

  const result = [];

  metricsByProduct.forEach(m => {
    result.push({
      productName: m.productName,
      visitsCount: m.visitsCount,
      totalQuantity: m.totalQuantity,
      avgQuantityPerVisit: m.visitsCount ? Number((m.totalQuantity / m.visitsCount).toFixed(2)) : 0,
      totalOrderValueJOD: Number(m.orderSum.toFixed(2)),
    });
  });

  return result;
};

const getTerritoryPerformanceReport = async params => {
  const filters = mapFilters(params);
  const where = buildWhereClause(filters);

  const [visits, territories] = await Promise.all([
    Visit.findAll({
      where,
      attributes: [
        'territoryId',
        'status',
        'hcpId',
        'pharmacyId',
        'orderValueJOD',
        'rating',
      ],
      raw: true,
    }),
    Territory.findAll({ raw: true }),
  ]);

  const territoriesById = new Map(territories.map(t => [t.id, t]));
  const metricsByTerritory = new Map();

  visits.forEach(visit => {
    if (!visit.territoryId) return;
    const territoryId = visit.territoryId;

    if (!metricsByTerritory.has(territoryId)) {
      metricsByTerritory.set(territoryId, {
        territoryId,
        totalVisits: 0,
        completedVisits: 0,
        uniqueAccounts: new Set(),
        orderSum: 0,
        orderCount: 0,
        ratingSum: 0,
        ratingCount: 0,
      });
    }

    const m = metricsByTerritory.get(territoryId);
    m.totalVisits += 1;

    if (visit.status === 'completed') m.completedVisits += 1;

    if (visit.hcpId) {
      m.uniqueAccounts.add(`hcp:${visit.hcpId}`);
    }
    if (visit.pharmacyId) {
      m.uniqueAccounts.add(`pharmacy:${visit.pharmacyId}`);
    }

    if (visit.orderValueJOD != null) {
      const v = Number(visit.orderValueJOD);
      if (Number.isFinite(v)) {
        m.orderSum += v;
        m.orderCount += 1;
      }
    }

    if (visit.rating != null) {
      const r = Number(visit.rating);
      if (Number.isFinite(r)) {
        m.ratingSum += r;
        m.ratingCount += 1;
      }
    }
  });

  const result = [];

  metricsByTerritory.forEach(m => {
    const territory = territoriesById.get(m.territoryId) || {};
    result.push({
      territoryId: m.territoryId,
      territoryName: territory.name || null,
      totalVisits: m.totalVisits,
      completedVisits: m.completedVisits,
      uniqueAccounts: m.uniqueAccounts.size,
      totalOrderValueJOD: Number(m.orderSum.toFixed(2)),
      avgOrderValueJOD: m.orderCount ? Number((m.orderSum / m.orderCount).toFixed(2)) : 0,
      avgRating: m.ratingCount ? Number((m.ratingSum / m.ratingCount).toFixed(2)) : 0,
    });
  });

  return result;
};

module.exports = {
  getVisitsReport,
  getOverviewReport,
  getRepPerformanceReport,
  getProductPerformanceReport,
  getTerritoryPerformanceReport,
};
