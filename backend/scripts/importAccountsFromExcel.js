// backend/scripts/importAccountsFromExcel.js
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const { initDb, sequelize } = require('../db');
const { Hcp, Pharmacy } = require('../models');

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

const isPharmacyRow = row => {
  const clientTag = normalizeString(row['Client Tag']);
  const specialty = normalizeString(row['Speciality']) || normalizeString(row['Specialty']);

  if (specialty && specialty.toLowerCase() === 'pharmacy') {
    return true;
  }

  if (clientTag && clientTag.toLowerCase() === 'pharmacy') {
    return true;
  }

  return false;
};

const buildHcpRecord = row => {
  const name = normalizeString(row['Name']);
  if (!name) {
    return null;
  }

  const clientTag = normalizeString(row['Client Tag']);
  const specialty = normalizeString(row['Speciality']) || normalizeString(row['Specialty']);
  const areaTag = normalizeString(row['Area Tag']) || normalizeString(row['Area']) || normalizeString(row['Tag']);

  return {
    name,
    areaTag,
    specialty,
    city: normalizeString(row['City']),
    area: normalizeString(row['Area']),
    segment: clientTag && clientTag.toLowerCase() !== 'pharmacy' ? clientTag : null,
    phone: normalizePhone(row['Phone']),
    mobile: null,
    email: normalizeEmail(row['Email']),
  };
};

const buildPharmacyRecord = row => {
  const name = normalizeString(row['Name']);
  if (!name) {
    return null;
  }

  const clientTag = normalizeString(row['Client Tag']);
  const areaTag = normalizeString(row['Area Tag']) || normalizeString(row['Area']) || normalizeString(row['Tag']);

  return {
    name,
    city: normalizeString(row['City']),
    area: normalizeString(row['Area']),
    phone: normalizePhone(row['Phone']),
    // We currently do not persist segment/areaTag on Pharmacy model;
    // this can be extended by adding nullable columns if needed later.
  };
};

async function main() {
  const workbookPath = path.join(__dirname, '..', '..', 'data', 'hcps.xlsx');

  if (!fs.existsSync(workbookPath)) {
    // eslint-disable-next-line no-console
    console.error('Cannot find Excel file at:', workbookPath);
    process.exitCode = 1;
    return;
  }

  await initDb();

  const workbook = xlsx.readFile(workbookPath);
  const sheet =
    workbook.Sheets['Name'] ||
    workbook.Sheets['HCPs'] ||
    workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    // eslint-disable-next-line no-console
    console.error('No worksheet found in hcps.xlsx');
    process.exitCode = 1;
    return;
  }

  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

  const hcpRecords = [];
  const pharmacyRecords = [];

  rows.forEach(row => {
    if (isPharmacyRow(row)) {
      const record = buildPharmacyRecord(row);
      if (record) {
        pharmacyRecords.push(record);
      }
    } else {
      const record = buildHcpRecord(row);
      if (record) {
        hcpRecords.push(record);
      }
    }
  });

  // eslint-disable-next-line no-console
  console.log('Preparing bulk import from Excel.');
  // eslint-disable-next-line no-console
  console.log('HCP rows to import: %d', hcpRecords.length);
  // eslint-disable-next-line no-console
  console.log('Pharmacy rows to import: %d', pharmacyRecords.length);

  try {
    if (hcpRecords.length) {
      await Hcp.bulkCreate(hcpRecords, { ignoreDuplicates: true });
    }
    if (pharmacyRecords.length) {
      await Pharmacy.bulkCreate(pharmacyRecords, { ignoreDuplicates: true });
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
      // eslint-disable-next-line no-console
      console.error('Some account rows were rejected due to validation/uniqueness issues.', error.message);
    } else {
      throw error;
    }
  }

  // eslint-disable-next-line no-console
  console.log('Import from Excel completed.');
}

main()
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error('Failed to import accounts from Excel:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await sequelize.close();
    } catch (_error) {
      // ignore
    }
  });
