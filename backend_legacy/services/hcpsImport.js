const path = require('path');
const XLSX = require('xlsx');
const { Hcp } = require('../models');

const normalizeString = value => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return String(value).trim();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  return null;
};

const normalizeEmail = value => {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : null;
};

const pickColumn = (row, keys) => {
  for (const key of keys) {
    if (key in row) {
      return row[key];
    }
  }
  return null;
};

const normalizeHcpRows = rows => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map(row => ({
      name: normalizeString(
        pickColumn(row, ['name', 'Name', 'hcp', 'HCP', 'hcpName', 'HCP Name']),
      ),
      specialty: normalizeString(pickColumn(row, ['specialty', 'Specialty'])),
      city: normalizeString(pickColumn(row, ['city', 'City'])),
      area: normalizeString(pickColumn(row, ['area', 'Area', 'Area/Zone'])),
      segment: normalizeString(pickColumn(row, ['segment', 'Segment'])),
      phone: normalizeString(pickColumn(row, ['phone', 'Phone'])),
      mobile: normalizeString(pickColumn(row, ['mobile', 'Mobile', 'mobileNumber'])),
      email: normalizeEmail(pickColumn(row, ['email', 'Email'])),
    }))
    .filter(row => row.name);
};

const buildLookup = row => {
  const lookup = {
    name: row.name,
    city: row.city || null,
    area: row.area || null,
  };

  return lookup;
};

const applyDefaults = row => {
  const areaTagParts = [row.city, row.area].filter(Boolean);
  return {
    ...row,
    areaTag: row.areaTag || (areaTagParts.length ? areaTagParts.join(' - ') : null),
  };
};

const importHcps = async rows => {
  const normalized = normalizeHcpRows(rows);
  const summary = {
    created: 0,
    updated: 0,
    skipped: 0,
    total: Array.isArray(rows) ? rows.length : normalized.length,
  };

  for (const row of normalized) {
    const payload = applyDefaults(row);
    if (!payload.name) {
      summary.skipped += 1;
      continue;
    }

    const lookup = buildLookup(payload);
    const existing = await Hcp.findOne({ where: lookup });

    if (existing) {
      await existing.update(payload);
      summary.updated += 1;
    } else {
      await Hcp.create(payload);
      summary.created += 1;
    }
  }

  return summary;
};

const loadHcpRowsFromWorkbook = (filePath, sheetName) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json(sheet, { defval: null });
};

const importHcpsFromFile = async (filePath, { sheetName } = {}) => {
  const absolutePath = path.resolve(filePath);
  const rows = loadHcpRowsFromWorkbook(absolutePath, sheetName);
  return importHcps(rows);
};

module.exports = {
  normalizeHcpRows,
  importHcps,
  importHcpsFromFile,
  loadHcpRowsFromWorkbook,
};
