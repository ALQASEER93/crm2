const { seedVisits } = require('../scripts/seedVisits');

module.exports = seedVisits;

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
