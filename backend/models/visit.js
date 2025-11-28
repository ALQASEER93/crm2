const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const ALLOWED_STATUSES = ['scheduled', 'completed', 'cancelled'];
const ALLOWED_ACCOUNT_TYPES = ['hcp', 'pharmacy'];
const ALLOWED_PURPOSES = [
  'promotion',
  'order_followup',
  'collection',
  'problem_solving',
  'training',
  'other',
];
const ALLOWED_CHANNELS = ['in_person', 'phone', 'online'];

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
    allowNull: true,
    field: 'hcp_id',
  },
  pharmacyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'pharmacy_id',
  },
  territoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'territory_id',
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_deleted',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  accountType: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [ALLOWED_ACCOUNT_TYPES],
    },
    field: 'account_type',
  },
  visitPurpose: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [ALLOWED_PURPOSES],
    },
    field: 'visit_purpose',
  },
  visitChannel: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [ALLOWED_CHANNELS],
    },
    field: 'visit_channel',
  },
  productsJson: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'products_json',
  },
  commitmentText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'commitment_text',
  },
  nextVisitDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'next_visit_date',
  },
  orderValueJOD: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'order_value_jod',
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
      isInt: true,
    },
  },
  startLat: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'start_lat',
  },
  startLng: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'start_lng',
  },
  endLat: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'end_lat',
  },
  endLng: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'end_lng',
  },
  startAccuracy: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'start_accuracy',
  },
  endAccuracy: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'end_accuracy',
  },
}, {
  tableName: 'visits',
  underscored: true,
  indexes: [
    { fields: ['visit_date'] },
    { fields: ['status'] },
    { fields: ['rep_id'] },
    { fields: ['hcp_id'] },
    { fields: ['pharmacy_id'] },
    { fields: ['territory_id'] },
    { unique: true, fields: ['visit_date', 'rep_id', 'hcp_id'] },
  ],
});

Visit.ALLOWED_STATUSES = ALLOWED_STATUSES;
Visit.ALLOWED_ACCOUNT_TYPES = ALLOWED_ACCOUNT_TYPES;
Visit.ALLOWED_PURPOSES = ALLOWED_PURPOSES;
Visit.ALLOWED_CHANNELS = ALLOWED_CHANNELS;

module.exports = Visit;
