const express = require('express');
const Territory = require('../models/territory');

const router = express.Router();

const serialize = territory => ({
  id: territory.id,
  name: territory.name,
  code: territory.code,
});

router.get('/', async (_req, res, next) => {
  try {
    const territories = await Territory.findAll({
      order: [
        ['name', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    res.json({ data: territories.map(serialize) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
