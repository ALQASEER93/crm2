const express = require('express');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const Hcp = require('../models/hcp');

const router = express.Router();

const normalizeRecord = record => ({
  name: typeof record.name === 'string' ? record.name.trim() : record.name,
  areaTag: typeof record.areaTag === 'string' ? record.areaTag.trim() : record.areaTag,
  specialty: typeof record.specialty === 'string' ? record.specialty.trim() : record.specialty,
  city: typeof record.city === 'string' ? record.city.trim() || null : record.city,
  area: typeof record.area === 'string' ? record.area.trim() || null : record.area,
  segment: typeof record.segment === 'string' ? record.segment.trim() || null : record.segment,
  phone: typeof record.phone === 'string' ? record.phone.trim() || null : record.phone,
  mobile: typeof record.mobile === 'string' ? record.mobile.trim() || null : record.mobile,
  email: typeof record.email === 'string' ? record.email.trim().toLowerCase() || null : record.email,
});

const isValidRecord = record => {
  if (!record || typeof record !== 'object') {
    return false;
  }

  const { name, areaTag, specialty } = record;
  if (!name || !areaTag || !specialty) {
    return false;
  }

  return true;
};

const buildLookup = record => {
  if (!record.name || !record.areaTag) {
    return null;
  }

  return { name: record.name, areaTag: record.areaTag };
};

router.post('/hcps', async (req, res, next) => {
  const records = Array.isArray(req.body)
    ? req.body
    : Array.isArray(req.body?.records)
      ? req.body.records
      : [];

  if (records.length === 0) {
    return res.status(400).json({ message: 'No HCP records provided for import.' });
  }

  const summary = {
    created: 0,
    updated: 0,
    rejected: 0,
    total: records.length,
    errors: [],
  };

  for (const [index, raw] of records.entries()) {
    const normalized = normalizeRecord(raw);

    if (!isValidRecord(normalized)) {
      summary.rejected += 1;
      summary.errors.push({ index, message: 'Record is missing required fields.' });
      continue;
    }

    try {
      const lookup = buildLookup(normalized);
      const existing = lookup ? await Hcp.findOne({ where: lookup }) : null;

      if (existing) {
        await existing.update(normalized);
        summary.updated += 1;
      } else {
        await Hcp.create(normalized);
        summary.created += 1;
      }
    } catch (error) {
      summary.rejected += 1;

      if (error instanceof ValidationError) {
        summary.errors.push({ index, message: error.message });
        continue;
      }

      if (error instanceof UniqueConstraintError) {
        summary.errors.push({ index, message: 'Duplicate record detected.' });
        continue;
      }

      return next(error);
    }
  }

  res.json(summary);
});

module.exports = router;
