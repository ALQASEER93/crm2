const Hcp = require('./hcp');
const Territory = require('./territory');
const SalesRep = require('./salesRep');
const Visit = require('./visit');
const Role = require('./role');
const User = require('./user');

Hcp.hasMany(Visit, { foreignKey: 'hcpId', as: 'visits' });
Visit.belongsTo(Hcp, { foreignKey: 'hcpId', as: 'hcp' });

Territory.hasMany(Visit, { foreignKey: 'territoryId', as: 'visits' });
Visit.belongsTo(Territory, { foreignKey: 'territoryId', as: 'territory' });

SalesRep.hasMany(Visit, { foreignKey: 'repId', as: 'visits' });
Visit.belongsTo(SalesRep, { foreignKey: 'repId', as: 'rep' });

Territory.hasMany(SalesRep, { foreignKey: 'territoryId', as: 'reps' });
SalesRep.belongsTo(Territory, { foreignKey: 'territoryId', as: 'territory' });

Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

module.exports = {
  Hcp,
  Territory,
  SalesRep,
  Visit,
  Role,
  User,
};
