// backend/scripts/importAccountsFromExcel.js
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const { initDb, sequelize } = require('../db');
const { Hcp, Pharmacy } = require('../models');

const JSON_PATH = path.join(__dirname, '..', 'db', 'accounts.fromExcel.json');
const ACCOUNTS_XLSX = path.join(__dirname, '..', 'data', 'accounts.xlsx');
const HCPS_XLSX = path.join(__dirname, '..', 'data', 'hcps.xlsx');

const normalizeString = value => {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
};

const normalizePhone = value => {
  if (value === undefined || value === null) return null;
  const s = String(value).replace(/[\s\-]+/g, '').trim();
  return s === '' ? null : s;
};

const normalizeEmail = value => {
  if (value === undefined || value === null) return null;
  const s = String(value).trim().toLowerCase();
  return s === '' ? null : s;
};

const pickValue = (row, ...keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }
  return null;
};

const isPharmacyRow = row => {
  const clientTag = normalizeString(pickValue(row, 'Client Tag', 'clientTag'));
  const specialty = normalizeString(pickValue(row, 'Speciality', 'Specialty', 'speciality', 'specialty'));

  if (specialty && specialty.toLowerCase() === 'pharmacy') {
    return true;
  }

  if (clientTag && clientTag.toLowerCase() === 'pharmacy') {
    return true;
  }

  return false;
};

const toHcpRecord = row => {
  const name = normalizeString(pickValue(row, 'Name', 'name'));
  if (!name) {
    return null;
  }

  const clientTag = normalizeString(pickValue(row, 'Client Tag', 'clientTag'));
  const specialty = normalizeString(pickValue(row, 'Speciality', 'Specialty', 'speciality', 'specialty'));
  const areaTag =
    normalizeString(pickValue(row, 'Area Tag', 'areaTag')) ||
    normalizeString(pickValue(row, 'Area', 'area')) ||
    normalizeString(pickValue(row, 'Tag', 'tag'));

  return {
    name,
    areaTag,
    specialty,
    city: normalizeString(pickValue(row, 'City', 'city')),
    area: normalizeString(pickValue(row, 'Area', 'area')),
    segment: clientTag && clientTag.toLowerCase() !== 'pharmacy' ? clientTag : null,
    phone: normalizePhone(pickValue(row, 'Phone', 'phone')),
    mobile: null,
    email: normalizeEmail(pickValue(row, 'Email', 'email')),
  };
};

const toPharmacyRecord = row => {
  const name = normalizeString(pickValue(row, 'Name', 'name'));
  if (!name) {
    return null;
  }

  return {
    name,
    city: normalizeString(pickValue(row, 'City', 'city')),
    area: normalizeString(pickValue(row, 'Area', 'area')),
    phone: normalizePhone(pickValue(row, 'Phone', 'phone')),
  };
};

const loadFromJson = () => {
  if (!fs.existsSync(JSON_PATH)) {
    return null;
  }

  const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  return {
    hcps: Array.isArray(raw.hcps) ? raw.hcps.map(toHcpRecord).filter(Boolean) : [],
    pharmacies: Array.isArray(raw.pharmacies) ? raw.pharmacies.map(toPharmacyRecord).filter(Boolean) : [],
    source: JSON_PATH,
  };
};

const loadFromExcel = () => {
  const excelPath = fs.existsSync(ACCOUNTS_XLSX) ? ACCOUNTS_XLSX : fs.existsSync(HCPS_XLSX) ? HCPS_XLSX : null;
  if (!excelPath) {
    return null;
  }

  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets['Name'] || workbook.Sheets['HCPs'] || workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new Error(`No worksheet found in ${path.basename(excelPath)}`);
  }

  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
  const hcps = [];
  const pharmacies = [];

  rows.forEach(row => {
    if (isPharmacyRow(row)) {
      const record = toPharmacyRecord(row);
      if (record) {
        pharmacies.push(record);
      }
    } else {
      const record = toHcpRecord(row);
      if (record) {
        hcps.push(record);
      }
    }
  });

  return { hcps, pharmacies, source: excelPath };
};

const loadAccounts = () => {
  const fromJson = loadFromJson();
  if (fromJson) {
    return fromJson;
  }
  return loadFromExcel();
};

async function main() {
  try {
    const payload = loadAccounts();
    if (!payload) {
      console.error('No accounts file found. Expected:', JSON_PATH, 'or', ACCOUNTS_XLSX);
      process.exitCode = 1;
      return;
    }

    const hcps = Array.isArray(payload.hcps) ? payload.hcps : [];
    const pharmacies = Array.isArray(payload.pharmacies) ? payload.pharmacies : [];
    const source = payload.source || 'unknown source';

    if (hcps.length === 0 && pharmacies.length === 0) {
      console.warn('No account rows were found in', source);
      return;
    }

    await initDb();

    const transaction = await sequelize.transaction();
    try {
      if (hcps.length) {
        await Hcp.bulkCreate(hcps, { ignoreDuplicates: true, transaction });
      }
      if (pharmacies.length) {
        await Pharmacy.bulkCreate(pharmacies, { ignoreDuplicates: true, transaction });
      }
      await transaction.commit();
      console.log(`Imported ${hcps.length} HCP(s) and ${pharmacies.length} pharmacy record(s) from ${source}.`);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        console.error('Some account rows were rejected due to validation/uniqueness issues.', error.message);
      } else {
        throw error;
      }
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Failed to import accounts from Excel/JSON:', error.message || error);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch (_error) {
      // Ignore close errors.
    }
  }
}

main();
