const { initDb, sequelize } = require('../db');
const { Territory, SalesRep, Hcp, Visit } = require('../models');
const sampleData = require('../db/sampleData');

const seedVisits = async () => {
  await initDb();
  const transaction = await sequelize.transaction();

  try {
    const territoryByCode = new Map();
    for (const territory of sampleData.territories) {
      const [record, created] = await Territory.findOrCreate({
        where: { code: territory.code },
        defaults: territory,
        transaction,
      });

      if (!created) {
        await record.update({ name: territory.name }, { transaction });
      }

      territoryByCode.set(record.code, record);
    }

    const hcpByKey = new Map();
    for (const hcp of sampleData.hcps) {
      const [record, created] = await Hcp.findOrCreate({
        where: { name: hcp.name, areaTag: hcp.areaTag },
        defaults: hcp,
        transaction,
      });

      if (!created) {
        await record.update(
          {
            specialty: hcp.specialty,
            phone: hcp.phone || null,
            email: hcp.email || null,
          },
          { transaction }
        );
      }

      hcpByKey.set(`${record.name}|${record.areaTag}`, record);
    }

    const salesRepByName = new Map();
    for (const rep of sampleData.salesReps) {
      const territory = territoryByCode.get(rep.territoryCode) || null;
      const [record, created] = await SalesRep.findOrCreate({
        where: { name: rep.name },
        defaults: {
          name: rep.name,
          email: rep.email || null,
          territoryId: territory ? territory.id : null,
        },
        transaction,
      });

      if (!created) {
        await record.update(
          {
            email: rep.email || null,
            territoryId: territory ? territory.id : null,
          },
          { transaction }
        );
      }

      salesRepByName.set(record.name, record);
    }

    let inserted = 0;
    for (const visit of sampleData.visits) {
      const territory = territoryByCode.get(visit.territoryCode);
      const rep = salesRepByName.get(visit.repName);
      const hcp = hcpByKey.get(`${visit.hcpName}|${visit.hcpAreaTag}`);

      if (!territory || !rep || !hcp) {
        throw new Error(`Invalid visit reference for ${visit.repName} / ${visit.hcpName}.`);
      }

      const payload = {
        visitDate: visit.visitDate,
        status: visit.status,
        durationMinutes: visit.durationMinutes,
        notes: visit.notes || null,
        repId: rep.id,
        hcpId: hcp.id,
        territoryId: territory.id,
      };

      const [record, created] = await Visit.findOrCreate({
        where: {
          visitDate: visit.visitDate,
          repId: rep.id,
          hcpId: hcp.id,
        },
        defaults: payload,
        transaction,
      });

      if (!created) {
        await record.update(payload, { transaction });
      }

      if (created) {
        inserted += 1;
      }
    }

    await transaction.commit();
    return { inserted };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

if (require.main === module) {
  seedVisits()
    .then(result => {
      console.log(`Seeded visits. ${result.inserted} new row(s) added.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to seed visits:', error);
      process.exit(1);
    });
}

module.exports = { seedVisits };
