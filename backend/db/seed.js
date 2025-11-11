const { initDb, sequelize } = require('./index');
const { Hcp, Territory, SalesRep, Visit } = require('../models');
const sampleData = require('./sampleData');

const buildLookupKey = (name, areaTag) => `${name}|${areaTag}`;

const seed = async () => {
  await initDb();

  const transaction = await sequelize.transaction();

  try {
    await Visit.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction });
    await SalesRep.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction });
    await Hcp.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction });
    await Territory.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction });

    const territories = await Territory.bulkCreate(sampleData.territories, { returning: true, transaction });
    const territoryByCode = new Map(territories.map(territory => [territory.code, territory]));

    const hcps = await Hcp.bulkCreate(sampleData.hcps, { returning: true, transaction });
    const hcpByKey = new Map(hcps.map(hcp => [buildLookupKey(hcp.name, hcp.areaTag), hcp]));

    const salesReps = [];
    for (const rep of sampleData.salesReps) {
      const territory = territoryByCode.get(rep.territoryCode) || null;
      const created = await SalesRep.create(
        {
          name: rep.name,
          email: rep.email || null,
          territoryId: territory ? territory.id : null,
        },
        { transaction }
      );
      salesReps.push(created);
    }
    const repByName = new Map(salesReps.map(rep => [rep.name, rep]));

    const visitPayloads = sampleData.visits.map(visit => {
      const territory = territoryByCode.get(visit.territoryCode);
      const rep = repByName.get(visit.repName);
      const hcp = hcpByKey.get(buildLookupKey(visit.hcpName, visit.hcpAreaTag));

      if (!territory || !rep || !hcp) {
        throw new Error(`Invalid visit reference for ${visit.repName} / ${visit.hcpName}.`);
      }

      return {
        visitDate: visit.visitDate,
        status: visit.status,
        durationMinutes: visit.durationMinutes,
        notes: visit.notes || null,
        repId: rep.id,
        hcpId: hcp.id,
        territoryId: territory.id,
      };
    });

    await Visit.bulkCreate(visitPayloads, { transaction });

    await transaction.commit();
    return { inserted: visitPayloads.length };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

if (require.main === module) {
  seed()
    .then(result => {
      console.log(`Seed completed. Inserted ${result.inserted} visits.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to seed data:', error);
      process.exit(1);
    });
}

module.exports = seed;
