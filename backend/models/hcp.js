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
    allowNull: true,
    validate: {
      notEmpty: true,
    },
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  area: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  segment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mobile: {
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
    { fields: ['city'] },
    { fields: ['area'] },
    { fields: ['specialty'] },
    { fields: ['segment'] },
  ],
});

module.exports = Hcp;
