const chargerService = require('./lib/chargerService');

async function testChargerService() {
    console.log("Testing chargerService...");
    try {
        const chargers = await chargerService.getChargers();
        console.log("Found", chargers.length, "chargers.");
        if (chargers.length > 0) {
            console.log("Sample charger:", JSON.stringify(chargers[0], null, 2));
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testChargerService();
