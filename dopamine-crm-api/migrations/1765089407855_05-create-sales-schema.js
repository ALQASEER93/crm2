/* eslint-disable @typescript-eslint/naming-convention */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('orders', {
    id: 'id',
    customer_type: { type: 'varchar(50)', notNull: true }, // 'pharmacy', 'hospital'
    customer_id: { type: 'integer', notNull: true },
    rep_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    ordered_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    status: { type: 'varchar(50)', notNull: true, default: 'pending' }, // pending, processing, shipped, delivered, cancelled
    total_amount: { type: 'decimal(12, 2)', notNull: true },
  });

  pgm.createTable('order_items', {
    id: 'id',
    order_id: {
      type: 'integer',
      notNull: true,
      references: '"orders"',
      onDelete: 'CASCADE',
    },
    product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"',
      onDelete: 'RESTRICT',
    },
    quantity: { type: 'integer', notNull: true },
    unit_price: { type: 'decimal(10, 2)', notNull: true },
    discount: { type: 'decimal(5, 2)', default: 0 },
  });

  pgm.createTable('invoices', {
    id: 'id',
    order_id: {
      type: 'integer',
      notNull: true,
      references: '"orders"',
      onDelete: 'CASCADE',
    },
    issued_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    status: { type: 'varchar(50)', notNull: true, default: 'unpaid' }, // unpaid, paid, overdue
    total_amount: { type: 'decimal(12, 2)', notNull: true },
  });

  pgm.createIndex('orders', 'rep_id');
  pgm.createIndex('orders', 'ordered_at');
  pgm.createIndex('order_items', 'order_id');
  pgm.createIndex('invoices', 'order_id');
};

exports.down = pgm => {
  pgm.dropTable('invoices');
  pgm.dropTable('order_items');
  pgm.dropTable('orders');
};
