const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const SalesRep = sequelize.define('SalesRep', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  territoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'territory_id',
  },
  repType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'sales_rep',
    validate: {
      isIn: [['sales_rep', 'medical_rep']],
    },
    field: 'rep_type',
  },
}, {
  tableName: 'sales_reps',
  underscored: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['territory_id'] },
    { unique: true, fields: ['email'] },
  ],
});

module.exports = SalesRep;
