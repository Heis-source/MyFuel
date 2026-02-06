const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

async function debugXml() {
    const DGT_URL = 'https://infocar.dgt.es/datex2/v3/miterd/EnergyInfrastructureTablePublication/electrolineras.xml';
    console.log("Fetching XML for debugging...");
    try {
        const response = await axios.get(DGT_URL, { timeout: 30000 });
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });
        const jsonObj = parser.parse(response.data);
        const payload = jsonObj['d2:payload'];
        const egiTable = payload['egi:energyInfrastructureTable'];
        console.log("EGI Table keys:", Object.keys(egiTable));
        const sites = egiTable['egi:energyInfrastructureSite'];
        if (sites) {
            console.log("Found sites! Total count:", Array.isArray(sites) ? sites.length : 1);
            const firstSite = Array.isArray(sites) ? sites[0] : sites;
            console.log("First site sample:", JSON.stringify(firstSite, null, 2).substring(0, 1000));
        } else {
            const stations = egiTable['egi:energyInfrastructureStation'];
            if (stations) {
                console.log("Found stations! Total count:", Array.isArray(stations) ? stations.length : 1);
                const firstStation = Array.isArray(stations) ? stations[0] : stations;
                console.log("First station sample:", JSON.stringify(firstStation, null, 2).substring(0, 1000));
            }
        }
    } catch (error) {
        console.error("Debug failed:", error);
    }
}

debugXml();
