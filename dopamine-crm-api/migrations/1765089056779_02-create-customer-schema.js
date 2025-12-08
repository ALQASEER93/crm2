/* eslint-disable @typescript-eslint/naming-convention */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('doctors', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    specialty: { type: 'varchar(255)' },
    organization: { type: 'varchar(255)' },
    city: { type: 'varchar(255)' },
    area: { type: 'varchar(255)' },
    phone: { type: 'varchar(50)' },
    email: { type: 'varchar(255)' },
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

  pgm.createTable('pharmacies', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    type: { type: 'varchar(100)' }, // e.g., chain, independent
    city: { type: 'varchar(255)' },
    area: { type: 'varchar(255)' },
    phone: { type: 'varchar(50)' },
    email: { type: 'varchar(255)' },
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

  pgm.createTable('hospitals', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    city: { type: 'varchar(255)' },
    area: { type: 'varchar(255)' },
    phone: { type: 'varchar(50)' },
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
};

exports.down = pgm => {
  pgm.dropTable('hospitals');
  pgm.dropTable('pharmacies');
  pgm.dropTable('doctors');
};
