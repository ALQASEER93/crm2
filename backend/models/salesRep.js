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
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  territoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'territory_id',
  },
}, {
  tableName: 'sales_reps',
  underscored: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['territory_id'] },
  ],
});

module.exports = SalesRep;
