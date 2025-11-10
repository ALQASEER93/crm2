const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Hcp = sequelize.define('Hcp', {
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
  areaTag: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
}, {
  tableName: 'hcps',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'area_tag'],
    },
  ],
});

module.exports = Hcp;
