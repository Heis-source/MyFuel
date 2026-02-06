'use strict';

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const DGT_URL = 'https://infocar.dgt.es/datex2/v3/miterd/EnergyInfrastructureTablePublication/electrolineras.xml';

let cache = {
    data: null,
    lastUpdate: 0
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function extractText(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number') return obj.toString();
    if (obj['#text']) return obj['#text'];
    if (obj['com:values']?.['com:value']) {
        const val = obj['com:values']['com:value'];
        return extractText(Array.isArray(val) ? val[0] : val);
    }
    return '';
}

async function getChargers() {
    const now = Date.now();
    
    if (cache.data && (now - cache.lastUpdate < CACHE_DURATION)) {
        console.log('Returning chargers from cache');
        return cache.data;
    }

    console.log('Fetching chargers from DGT...');
    try {
        const response = await axios.get(DGT_URL, { timeout: 60000 });
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });
        
        const jsonObj = parser.parse(response.data);
        const payload = jsonObj['d2:payload'] || {};
        const table = payload['egi:energyInfrastructureTable'] || {};
        const sites = table['egi:energyInfrastructureSite'];

        if (!sites) {
            throw new Error('Could not find egi:energyInfrastructureSite in DGT XML');
        }

        const siteArray = Array.isArray(sites) ? sites : [sites];

        // Normalize data
        const normalized = siteArray.map(s => {
            const name = extractText(s['fac:name']);
            
            // Location extraction
            const locRef = s['fac:locationReference'] || {};
            const displayLoc = locRef['loc:locationForDisplay'] || {};
            const lat = displayLoc['loc:latitude'];
            const lon = displayLoc['loc:longitude'];
            
            // Address extraction
            const ext = locRef['loc:_locationReferenceExtension'] || {};
            const facLoc = ext['loc:facilityLocation'] || {};
            const addressObj = facLoc['locx:address'] || {};
            const postcode = addressObj['locx:postcode'];
            const addressLines = addressObj['locx:addressLine'];
            let address = '';
            if (addressLines) {
                const lineArray = Array.isArray(addressLines) ? addressLines : [addressLines];
                address = lineArray.map(l => extractText(l['locx:text'])).filter(Boolean).join(', ');
            }

            // Equipment/Connectors info
            const stations = s['egi:energyInfrastructureStation'];
            const connectors = [];
            
            if (stations) {
                const stationArray = Array.isArray(stations) ? stations : [stations];
                stationArray.forEach(st => {
                    const equipment = st['fac:equipment'];
                    if (equipment) {
                        const equipArray = Array.isArray(equipment) ? equipment : [equipment];
                        equipArray.forEach(e => {
                            const conn = e['fac:connector'];
                            if (conn) {
                                const connArray = Array.isArray(conn) ? conn : [conn];
                                connArray.forEach(c => {
                                    connectors.push({
                                        type: c['fac:connectorType'],
                                        power: c['fac:maxPower']
                                    });
                                });
                            }
                        });
                    }
                });
            }

            return {
                id: s['@_id'],
                name: name,
                address: address,
                postcode: postcode,
                latitude: lat,
                longitude: lon,
                connectors: connectors,
                lastUpdated: s['fac:lastUpdated']
            };
        });

        cache.data = normalized;
        cache.lastUpdate = now;
        
        return normalized;
    } catch (error) {
        console.error('Error in chargerService:', error.message);
        if (cache.data) return cache.data;
        throw error;
    }
}

module.exports = {
    getChargers
};
