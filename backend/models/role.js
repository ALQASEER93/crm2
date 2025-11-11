const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Role = sequelize.define('Role', {
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
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isLowercase: true,
    },
  },
}, {
  tableName: 'roles',
  underscored: true,
});

module.exports = Role;
