const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

// Join table linking users to territories. No timestamps to keep it lightweight.
const UserTerritory = sequelize.define(
  'UserTerritory',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      primaryKey: true,
    },
    territoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'territory_id',
      primaryKey: true,
    },
  },
  {
    tableName: 'user_territories',
    timestamps: false,
    underscored: true,
  },
);

module.exports = UserTerritory;
