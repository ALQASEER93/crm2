const Role = require('./role');
const User = require('./user');
const Hcp = require('./hcp');
const SalesRep = require('./salesRep');
const Territory = require('./territory');
const Visit = require('./visit');
const Pharmacy = require('./pharmacy');
const UserTerritory = require('./userTerritory');

Visit.belongsTo(Hcp, { foreignKey: 'hcp_id', as: 'hcp' });
Visit.belongsTo(Pharmacy, { foreignKey: 'pharmacy_id', as: 'pharmacy' });
Visit.belongsTo(SalesRep, { foreignKey: 'rep_id', as: 'rep' });
Visit.belongsTo(Territory, { foreignKey: 'territory_id', as: 'territory' });

User.belongsToMany(Territory, {
  through: UserTerritory,
  foreignKey: 'user_id',
  otherKey: 'territory_id',
  as: 'territories',
});
Territory.belongsToMany(User, {
  through: UserTerritory,
  foreignKey: 'territory_id',
  otherKey: 'user_id',
  as: 'users',
});

module.exports = {
  Role,
  User,
  Hcp,
  SalesRep,
  Territory,
  Visit,
  Pharmacy,
  UserTerritory,
};
