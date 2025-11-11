const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const Role = require('./role');

const User = sequelize.define('User', {
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
      notEmpty: true,
      isEmail: true,
    },
    set(value) {
      if (typeof value === 'string') {
        this.setDataValue('email', value.trim().toLowerCase());
      } else {
        this.setDataValue('email', value);
      }
      isEmail: true,
      notEmpty: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash',
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'role_id',
  },
}, {
  tableName: 'users',
  underscored: true,
});

User.belongsTo(Role, {
  as: 'role',
  foreignKey: {
    name: 'roleId',
    allowNull: false,
  },
  onDelete: 'RESTRICT',
});

Role.hasMany(User, {
  as: 'users',
  foreignKey: 'roleId',
  onDelete: 'RESTRICT',
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['role_id'] },
  ],
});

module.exports = User;
