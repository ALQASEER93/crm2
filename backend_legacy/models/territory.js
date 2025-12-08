const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Territory = sequelize.define('Territory', {
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
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
}, {
  tableName: 'territories',
  underscored: true,
  indexes: [
    { unique: true, fields: ['code'] },
  ],
});

module.exports = Territory;
