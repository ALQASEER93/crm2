const express = require('express');
const SalesRep = require('../models/salesRep');
const { hasAnyRole } = require('../middleware/auth');

const router = express.Router();

const serialize = rep => ({
  id: rep.id,
  name: rep.name,
  email: rep.email,
  territoryId: rep.territoryId,
});

router.get('/', async (req, res, next) => {
  try {
    if (hasAnyRole(req.user, ['sales_manager'])) {
      const reps = await SalesRep.findAll({
        order: [
          ['name', 'ASC'],
          ['id', 'ASC'],
        ],
      });
      return res.json({ data: reps.map(serialize) });
    }

    if (hasAnyRole(req.user, ['sales_rep'])) {
      const reps = await SalesRep.findAll({
        where: { email: req.user.email },
      });
      return res.json({ data: reps.map(serialize) });
    }

    return res.status(403).json({ message: 'Insufficient permissions.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
