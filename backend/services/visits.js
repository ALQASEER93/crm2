const { Op, fn, col, where: whereFn } = require('sequelize');
const { stringify } = require('csv-stringify/sync');
const { Visit, Hcp, SalesRep, Territory, Pharmacy } = require('../models');

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const SORT_FIELDS = {
  visitDate: ['visitDate'],
  status: ['status'],
  durationMinutes: ['durationMinutes'],
  hcpName: [{ model: Hcp, as: 'hcp' }, 'name'],
  repName: [{ model: SalesRep, as: 'rep' }, 'name'],
  territoryName: [{ model: Territory, as: 'territory' }, 'name'],
};

const baseInclude = [
  {
    model: Hcp,
    as: 'hcp',
    attributes: ['id', 'name', 'areaTag', 'specialty', 'phone', 'email', 'segment'],
  },
  {
    model: Pharmacy,
    as: 'pharmacy',
    attributes: ['id', 'name', 'city', 'area', 'phone'],
  },
  {
    model: SalesRep,
    as: 'rep',
    attributes: ['id', 'name', 'email'],
  },
  {
    model: Territory,
    as: 'territory',
    attributes: ['id', 'name', 'code'],
  },
];

const normalizeArray = value => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
};

const parseIntegerList = value => {
  const entries = normalizeArray(value);
  return entries
    .map(entry => Number.parseInt(entry, 10))
    .filter(number => Number.isInteger(number));
};

const buildWhereClause = filters => {
  const where = { isDeleted: false };
  const andConditions = [];

  if (filters.includeDeleted) {
    delete where.isDeleted;
  }

  if (filters.status) {
    const statuses = normalizeArray(filters.status);
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else if (statuses.length > 1) {
      where.status = { [Op.in]: statuses };
    }
  }

  if (filters.repId) {
    const repIds = parseIntegerList(filters.repId);
    if (repIds.length === 1) {
      where.repId = repIds[0];
    } else if (repIds.length > 1) {
      where.repId = { [Op.in]: repIds };
    }
  }

  if (filters.hcpId) {
    const hcpIds = parseIntegerList(filters.hcpId);
    if (hcpIds.length === 1) {
      where.hcpId = hcpIds[0];
    } else if (hcpIds.length > 1) {
      where.hcpId = { [Op.in]: hcpIds };
    }
  }

  if (filters.territoryId) {
    const territoryIds = parseIntegerList(filters.territoryId);
    if (territoryIds.length === 1) {
      where.territoryId = territoryIds[0];
    } else if (territoryIds.length > 1) {
      where.territoryId = { [Op.in]: territoryIds };
    }
  }

  if (filters.dateFrom || filters.dateTo) {
    where.visitDate = {};
    if (filters.dateFrom) {
      where.visitDate[Op.gte] = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.visitDate[Op.lte] = filters.dateTo;
    }
  }

  const searchTerm = typeof filters.q === 'string' ? filters.q.trim().toLowerCase() : '';
  if (searchTerm) {
    const likePattern = `%${searchTerm}%`;
    andConditions.push({
      [Op.or]: [
        whereFn(fn('lower', col('hcp.name')), { [Op.like]: likePattern }),
        whereFn(fn('lower', col('hcp.area_tag')), { [Op.like]: likePattern }),
        whereFn(fn('lower', col('rep.name')), { [Op.like]: likePattern }),
        whereFn(fn('lower', col('territory.name')), { [Op.like]: likePattern }),
      ],
    });
  }

  if (andConditions.length) {
    where[Op.and] = (where[Op.and] || []).concat(andConditions);
  }

  return where;
};

const serializeVisit = visit => {
  let account = null;
  if (visit.accountType === 'hcp' && visit.hcp) {
    account = {
      id: visit.hcp.id,
      name: visit.hcp.name,
      type: 'hcp',
      areaTag: visit.hcp.areaTag || null,
      segment: visit.hcp.segment || null,
    };
  } else if (visit.accountType === 'pharmacy' && visit.pharmacy) {
    account = {
      id: visit.pharmacy.id,
      name: visit.pharmacy.name,
      type: 'pharmacy',
      areaTag: visit.pharmacy.area || null,
      segment: 'Pharmacy',
    };
  }

  let products = null;
  if (typeof visit.productsJson === 'string' && visit.productsJson.trim()) {
    try {
      const parsed = JSON.parse(visit.productsJson);
      if (Array.isArray(parsed)) {
        products = parsed;
      }
    } catch (_error) {
      products = null;
    }
  }

  return {
    id: visit.id,
    visitDate: visit.visitDate,
    status: visit.status,
    durationMinutes: visit.durationMinutes,
    notes: visit.notes || null,
    rep: visit.rep
      ? {
          id: visit.rep.id,
          name: visit.rep.name,
          email: visit.rep.email,
        }
      : null,
    hcp: visit.hcp
      ? {
          id: visit.hcp.id,
          name: visit.hcp.name,
          areaTag: visit.hcp.areaTag,
          specialty: visit.hcp.specialty,
          phone: visit.hcp.phone,
          email: visit.hcp.email,
        }
      : null,
    pharmacy: visit.pharmacy
      ? {
          id: visit.pharmacy.id,
          name: visit.pharmacy.name,
          city: visit.pharmacy.city,
          area: visit.pharmacy.area,
          phone: visit.pharmacy.phone,
        }
      : null,
    accountType: visit.accountType || null,
    hcpId: visit.hcpId || null,
    pharmacyId: visit.pharmacyId || null,
    account,
    visitPurpose: visit.visitPurpose || null,
    visitChannel: visit.visitChannel || null,
    products,
    commitmentText: visit.commitmentText || null,
    nextVisitDate: visit.nextVisitDate || null,
    orderValueJOD: visit.orderValueJOD != null ? Number(visit.orderValueJOD) : null,
    rating: visit.rating != null ? visit.rating : null,
    startLocation:
      visit.startLat != null && visit.startLng != null
        ? {
            lat: visit.startLat,
            lng: visit.startLng,
            accuracy: visit.startAccuracy != null ? visit.startAccuracy : null,
          }
        : null,
    endLocation:
      visit.endLat != null && visit.endLng != null
        ? {
            lat: visit.endLat,
            lng: visit.endLng,
            accuracy: visit.endAccuracy != null ? visit.endAccuracy : null,
          }
        : null,
    territory: visit.territory
      ? {
          id: visit.territory.id,
          name: visit.territory.name,
          code: visit.territory.code,
        }
      : null,
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt,
  };
};

const listVisits = async params => {
  const page = params.page || DEFAULT_PAGE;
  const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
  const sortBy = params.sortBy && SORT_FIELDS[params.sortBy] ? params.sortBy : 'visitDate';
  const sortDirection = params.sortDirection === 'asc' ? 'ASC' : 'DESC';

  const where = buildWhereClause(params);

  const order = [[...SORT_FIELDS[sortBy], sortDirection], ['id', 'ASC']];

  const { rows, count } = await Visit.findAndCountAll({
    where,
    include: baseInclude,
    order,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    distinct: true,
  });

  const totalPages = Math.ceil(count / pageSize) || 1;

  return {
    data: rows.map(serializeVisit),
    meta: {
      page,
      pageSize,
      total: count,
      totalPages,
      sortBy,
      sortDirection: sortDirection.toLowerCase(),
      filters: {
        status: params.status || null,
        repId: params.repId || null,
        hcpId: params.hcpId || null,
        territoryId: params.territoryId || null,
        dateFrom: params.dateFrom || null,
        dateTo: params.dateTo || null,
        q: params.q || null,
      },
    },
  };
};

const summarizeVisits = async params => {
  const where = buildWhereClause(params);
  const baseWhere = { ...where };
  const statusConstraint = baseWhere.status;

  if (statusConstraint !== undefined) {
    delete baseWhere.status;
  }

  const combinedWhere = statusConstraint === undefined
    ? { ...baseWhere }
    : { ...baseWhere, status: statusConstraint };

  const statusWhere = status => {
    if (statusConstraint === undefined) {
      return { ...baseWhere, status };
    }

    if (typeof statusConstraint === 'string') {
      if (statusConstraint !== status) {
        return null;
      }
      return { ...baseWhere, status };
    }

    if (statusConstraint?.[Op.in]) {
      const allowed = statusConstraint[Op.in];
      if (!allowed.includes(status)) {
        return null;
      }
      return { ...baseWhere, status };
    }

    return { ...baseWhere, status };
  };

  const getCount = async status => {
    const clause = statusWhere(status);
    if (!clause) {
      return 0;
    }
    return Visit.count({ where: clause });
  };

  const [
    totalVisits,
    completedVisits,
    scheduledVisits,
    cancelledVisits,
    uniqueHcps,
    uniqueReps,
    uniqueTerritories,
    durationStats,
    lastVisitDate,
  ] = await Promise.all([
    Visit.count({ where: combinedWhere }),
    getCount('completed'),
    getCount('scheduled'),
    getCount('cancelled'),
    Visit.count({ where: combinedWhere, distinct: true, col: 'hcp_id' }),
    Visit.count({ where: combinedWhere, distinct: true, col: 'rep_id' }),
    Visit.count({ where: combinedWhere, distinct: true, col: 'territory_id' }),
    Visit.findOne({
      attributes: [
        [fn('AVG', col('duration_minutes')), 'avgDuration'],
        [fn('SUM', col('duration_minutes')), 'totalDuration'],
      ],
      where: combinedWhere,
      raw: true,
    }),
    Visit.max('visitDate', { where: combinedWhere }),
  ]);

  const averageDuration = durationStats?.avgDuration ? Number.parseFloat(durationStats.avgDuration) : 0;
  const totalDuration = durationStats?.totalDuration ? Number.parseFloat(durationStats.totalDuration) : 0;

  return {
    totalVisits,
    completedVisits,
    scheduledVisits,
    cancelledVisits,
    uniqueHcps,
    uniqueReps,
    uniqueTerritories,
    averageDurationMinutes: Number.isFinite(averageDuration) ? Number(averageDuration.toFixed(2)) : 0,
    totalDurationMinutes: Number.isFinite(totalDuration) ? Math.round(totalDuration) : 0,
    lastVisitDate: lastVisitDate || null,
  };
};

const exportVisits = async params => {
  const where = buildWhereClause(params);
  const sortBy = params.sortBy && SORT_FIELDS[params.sortBy] ? params.sortBy : 'visitDate';
  const sortDirection = params.sortDirection === 'asc' ? 'ASC' : 'DESC';

  const visits = await Visit.findAll({
    where,
    include: baseInclude,
    order: [[...SORT_FIELDS[sortBy], sortDirection], ['id', 'ASC']],
  });

  const records = visits.map(serializeVisit).map(visit => ({
    id: visit.id,
    visitDate: visit.visitDate,
    status: visit.status,
    durationMinutes: visit.durationMinutes,
    repName: visit.rep?.name || '',
    repEmail: visit.rep?.email || '',
    hcpName: visit.hcp?.name || '',
    hcpAreaTag: visit.hcp?.areaTag || '',
    territoryName: visit.territory?.name || '',
    territoryCode: visit.territory?.code || '',
    notes: visit.notes || '',
  }));

  const csv = stringify(records, {
    header: true,
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'visitDate', header: 'Visit Date' },
      { key: 'status', header: 'Status' },
      { key: 'durationMinutes', header: 'Duration (minutes)' },
      { key: 'repName', header: 'Sales Rep' },
      { key: 'repEmail', header: 'Sales Rep Email' },
      { key: 'hcpName', header: 'HCP' },
      { key: 'hcpAreaTag', header: 'HCP Area Tag' },
      { key: 'territoryName', header: 'Territory' },
      { key: 'territoryCode', header: 'Territory Code' },
      { key: 'notes', header: 'Notes' },
    ],
  });

  return csv;
};

const findVisitById = async id => {
  const parsedId = Number.parseInt(id, 10);
  if (!Number.isInteger(parsedId)) {
    return null;
  }

  return Visit.findByPk(parsedId, {
    include: baseInclude,
  });
};

const createVisit = async payload => {
  const visit = await Visit.create(payload);
  await visit.reload({ include: baseInclude });
  return serializeVisit(visit);
};

const updateVisit = async (visit, payload) => {
  await visit.update(payload);
  await visit.reload({ include: baseInclude });
  return serializeVisit(visit);
};

const softDeleteVisit = async visit => {
  await visit.update({ isDeleted: true });
};

module.exports = {
  listVisits,
  summarizeVisits,
  exportVisits,
  serializeVisit,
  buildWhereClause,
  findVisitById,
  createVisit,
  updateVisit,
  softDeleteVisit,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
};
