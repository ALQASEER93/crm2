const Role = require('./role');
const User = require('./user');
const Hcp = require('./hcp');
const SalesRep = require('./salesRep');
const Territory = require('./territory');
const Visit = require('./visit');
const Pharmacy = require('./pharmacy');

Visit.belongsTo(Hcp, { foreignKey: 'hcp_id', as: 'hcp' });
Visit.belongsTo(Pharmacy, { foreignKey: 'pharmacy_id', as: 'pharmacy' });
Visit.belongsTo(SalesRep, { foreignKey: 'rep_id', as: 'rep' });
Visit.belongsTo(Territory, { foreignKey: 'territory_id', as: 'territory' });

module.exports = {
  Role,
  User,
  Hcp,
  SalesRep,
  Territory,
  Visit,
  Pharmacy,
};
