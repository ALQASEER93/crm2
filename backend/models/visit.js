const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const ALLOWED_STATUSES = ['scheduled', 'completed', 'cancelled'];

const Visit = sequelize.define('Visit', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  visitDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: true,
      isDate: true,
    },
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [ALLOWED_STATUSES],
    },
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      isInt: true,
    },
  },
  repId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'rep_id',
  },
  hcpId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'hcp_id',
  },
  territoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'territory_id',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'visits',
  underscored: true,
  indexes: [
    { fields: ['visit_date'] },
    { fields: ['status'] },
    { fields: ['rep_id'] },
    { fields: ['hcp_id'] },
    { fields: ['territory_id'] },
  ],
});

Visit.ALLOWED_STATUSES = ALLOWED_STATUSES;

module.exports = Visit;
