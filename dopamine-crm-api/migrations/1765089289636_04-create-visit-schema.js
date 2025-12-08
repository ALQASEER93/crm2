/* eslint-disable @typescript-eslint/naming-convention */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('visit_plans', {
    id: 'id',
    rep_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    period_start: { type: 'date', notNull: true },
    period_end: { type: 'date', notNull: true },
    target_coverage: { type: 'integer' }, // e.g., 80%
    status: { type: 'varchar(50)', notNull: true, default: 'draft' }, // draft, active, completed
  });

  pgm.createTable('visit_plan_items', {
    id: 'id',
    plan_id: {
      type: 'integer',
      notNull: true,
      references: '"visit_plans"',
      onDelete: 'CASCADE',
    },
    account_type: { type: 'varchar(50)', notNull: true }, // 'doctor', 'pharmacy', 'hospital'
    account_id: { type: 'integer', notNull: true },
    target_visits: { type: 'integer', notNull: true, default: 1 },
  });

  pgm.createTable('visits', {
    id: 'id',
    rep_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    account_type: { type: 'varchar(50)', notNull: true },
    account_id: { type: 'integer', notNull: true },
    planned_at: { type: 'timestamp' },
    start_time: { type: 'timestamp' },
    end_time: { type: 'timestamp' },
    location_lat: { type: 'decimal(10, 8)' },
    location_lng: { type: 'decimal(11, 8)' },
    visit_type: { type: 'varchar(50)' }, // e.g., planned, unplanned
    status: { type: 'varchar(50)', notNull: true, default: 'scheduled' }, // scheduled, in_progress, completed, cancelled
    notes: { type: 'text' },
  });

  pgm.createTable('visit_items', {
    id: 'id',
    visit_id: {
      type: 'integer',
      notNull: true,
      references: '"visits"',
      onDelete: 'CASCADE',
    },
    product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"',
      onDelete: 'RESTRICT',
    },
    samples_qty: { type: 'integer', default: 0 },
    promo_materials: { type: 'text' },
    notes: { type: 'text' },
  });

  pgm.createIndex('visit_plans', 'rep_id');
  pgm.createIndex('visit_plan_items', 'plan_id');
  pgm.createIndex('visits', 'rep_id');
  pgm.createIndex('visits', 'planned_at');
  pgm.createIndex('visit_items', 'visit_id');
};

exports.down = pgm => {
  pgm.dropTable('visit_items');
  pgm.dropTable('visits');
  pgm.dropTable('visit_plan_items');
  pgm.dropTable('visit_plans');
};
