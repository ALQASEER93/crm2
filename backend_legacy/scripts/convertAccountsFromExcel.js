// backend/scripts/convertAccountsFromExcel.js
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function normalizePhone(value) {
  if (value === undefined || value === null) return null;
  let s = String(value).trim();
  s = s.replace(/[\s\-]+/g, '');
  return s === '' ? null : s;
}

async function main() {
  try {
    const workbookPath = path.join(__dirname, '..', 'data', 'accounts.xlsx');
    if (!fs.existsSync(workbookPath)) {
      console.error('Cannot find Excel file:', workbookPath);
      process.exitCode = 1;
      return;
    }

    const workbook = xlsx.readFile(workbookPath);
    const sheet = workbook.Sheets['Name'];
    if (!sheet) {
      console.error('Sheet "Name" not found in accounts.xlsx');
      process.exitCode = 1;
      return;
    }

    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    const hcps = [];
    const pharmacies = [];

    for (const row of rows) {
      const clientTag = normalizeString(row['Client Tag']);
      const isPharmacy = clientTag && clientTag.toLowerCase() === 'pharmacy';

      const base = {
        name: normalizeString(row['Name']),
        representativeName: normalizeString(row['Representative Name']),
        area: normalizeString(row['Area']),
        tag: normalizeString(row['Tag']),
        clientTag,
        comment: normalizeString(row['Comment']),
        phone: normalizePhone(row['Phone']),
        email: normalizeString(row['Email']),
        website: normalizeString(row['Website']),
        city: normalizeString(row['City']),
        region: normalizeString(row['Region']),
        country: normalizeString(row['Country']) || 'Jordan',
        formattedAddress: normalizeString(row['Formatted Address']),
      };

      if (!base.name) continue;

      if (isPharmacy) {
        pharmacies.push({
          ...base,
          type: 'pharmacy',
        });
      } else {
        hcps.push({
          ...base,
          type: 'hcp',
          speciality: normalizeString(row['Speciality']),
          segment: clientTag, // A/B/C/...,
        });
      }
    }

    const output = {
      generatedAt: new Date().toISOString(),
      counts: {
        hcps: hcps.length,
        pharmacies: pharmacies.length,
      },
      hcps,
      pharmacies,
    };

    const outPath = path.join(__dirname, '..', 'db', 'accounts.fromExcel.json');
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

    console.log('Exported accounts to', outPath);
    console.log(`HCPs: ${output.counts.hcps}, Pharmacies: ${output.counts.pharmacies}`);
  } catch (error) {
    console.error('Failed to convert accounts from Excel:', error.message);
    process.exitCode = 1;
  }
}

main();
