/* eslint-disable @typescript-eslint/naming-convention */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('roles', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true, unique: true },
    permissions_json: { type: 'jsonb', notNull: true, default: '{}' },
  });

  pgm.createTable('territories', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    parent_id: {
      type: 'integer',
      references: '"territories"',
      onDelete: 'SET NULL',
    },
  });

  pgm.createTable('users', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    role_id: {
      type: 'integer',
      notNull: true,
      references: '"roles"',
      onDelete: 'RESTRICT',
    },
    territory_id: {
      type: 'integer',
      references: '"territories"',
      onDelete: 'SET NULL',
    },
    status: { type: 'varchar(50)', notNull: true, default: 'active' }, // e.g., active, inactive, pending
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

  pgm.createTable('user_territories', {
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
      primaryKey: true,
    },
    territory_id: {
      type: 'integer',
      notNull: true,
      references: '"territories"',
      onDelete: 'CASCADE',
      primaryKey: true,
    },
  });

  pgm.createIndex('users', 'role_id');
  pgm.createIndex('users', 'territory_id');
};

exports.down = pgm => {
  pgm.dropTable('user_territories');
  pgm.dropTable('users');
  pgm.dropTable('territories');
  pgm.dropTable('roles');
};
