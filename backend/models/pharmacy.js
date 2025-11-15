const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Pharmacy = sequelize.define(
  'Pharmacy',
  {
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
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'pharmacies',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name', 'city', 'area'],
      },
      { fields: ['city'] },
      { fields: ['area'] },
    ],
  },
);

module.exports = Pharmacy;
