/* eslint-disable @typescript-eslint/naming-convention */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('product_lines', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
  });

  pgm.createTable('products', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    code: { type: 'varchar(100)', unique: true },
    molecule: { type: 'varchar(255)' },
    line_id: {
      type: 'integer',
      references: '"product_lines"',
      onDelete: 'SET NULL',
    },
    price: { type: 'decimal(10, 2)' },
    status: { type: 'varchar(50)', notNull: true, default: 'active' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('product_materials', {
    id: 'id',
    product_id: {
      type: 'integer',
      notNull: true,
      references: '"products"',
      onDelete: 'CASCADE',
    },
    type: { type: 'varchar(100)' }, // e.g., brochure, presentation, video
    file_path: { type: 'varchar(1024)', notNull: true },
    description: { type: 'text' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('products', 'line_id');
  pgm.createIndex('product_materials', 'product_id');
};

exports.down = pgm => {
  pgm.dropTable('product_materials');
  pgm.dropTable('products');
  pgm.dropTable('product_lines');
};
