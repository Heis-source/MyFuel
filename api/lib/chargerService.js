'use strict';

/**
 * @module chargerService
 * @description Provides functionality to fetch, parse and cache EV charger data from DGT (DATEX II v3).
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

/**
 * URL for the official DGT EV infrastructure publication (XML).
 * @constant {string}
 */
const DGT_URL = 'https://infocar.dgt.es/datex2/v3/miterd/EnergyInfrastructureTablePublication/electrolineras.xml';

/**
 * In-memory cache for charger data.
 * @type {{data: Array|null, lastUpdate: number}}
 */
let cache = {
    data: null,
    lastUpdate: 0
};

/**
 * Cache TTL: 1 hour.
 * @constant {number}
 */
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Internal helper to safely extract text from various XML nodes produced by fast-xml-parser.
 * Handles '#text' nodes and nested 'com:value' structures.
 * 
 * @param {any} obj - The XML node/object to parse.
 * @returns {string} The extracted plain text.
 * @private
 */
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

function toNumberOrNull(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function toStringOrEmpty(value) {
    if (value === null || value === undefined) return '';
    return String(value);
}

/**
 * Fetches all EV charging stations from DGT, parses the XML, and normalizes it into JSON.
 * Implements in-memory caching to optimize performance and respect server limits.
 * 
 * @async
 * @function getChargers
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of normalized charger objects.
 * @throws {Error} If the XML structure is invalid or fetching fails and no cache exists.
 */
async function getChargers() {
    const now = Date.now();
    
    // Return from cache if still valid
    if (cache.data && (now - cache.lastUpdate < CACHE_DURATION)) {
        return cache.data;
    }

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
            throw new Error('Could not find mandatory egi:energyInfrastructureSite in DGT publication');
        }

        const siteArray = Array.isArray(sites) ? sites : [sites];

        // Normalize data to a clean JSON structure
        const normalized = siteArray.map(s => {
            const name = extractText(s['fac:name']);
            
            // Location metadata
            const locRef = s['fac:locationReference'] || {};
            const displayLoc = locRef['loc:coordinatesForDisplay'] || {};
            const lat = toNumberOrNull(displayLoc['loc:latitude']);
            const lon = toNumberOrNull(displayLoc['loc:longitude']);
            
            // Address details (nested within extensions in DATEX II v3)
            const ext = locRef['loc:_locationReferenceExtension'] || {};
            const facLoc = ext['loc:facilityLocation'] || {};
            const addressObj = facLoc['locx:address'] || {};
            const postcode = toStringOrEmpty(addressObj['locx:postcode']);
            const addressLines = addressObj['locx:addressLine'];
            let address = '';
            
            if (addressLines) {
                const lineArray = Array.isArray(addressLines) ? addressLines : [addressLines];
                address = lineArray.map(l => extractText(l['locx:text'])).filter(Boolean).join(', ');
            }

            // Connector & Power info (DATEX II v3 structure)
            const stations = s['egi:energyInfrastructureStation'];
            const connectors = [];
            
            if (stations) {
                const stationArray = Array.isArray(stations) ? stations : [stations];
                stationArray.forEach(st => {
                    const refillPoints = st['egi:refillPoint'];
                    if (refillPoints) {
                        const rpArray = Array.isArray(refillPoints) ? refillPoints : [refillPoints];
                        rpArray.forEach(rp => {
                            const conn = rp['egi:connector'];
                            if (conn) {
                                const connArray = Array.isArray(conn) ? conn : [conn];
                                connArray.forEach(c => {
                                    // Power is usually in Watts, convert to kW
                                    const powerW = toNumberOrNull(c['egi:maxPowerAtSocket']) || 0;
                                    const powerKw = powerW > 0 ? Number((powerW / 1000).toFixed(1)) : null;
                                    connectors.push({
                                        type: extractText(c['egi:connectorType']) || null,
                                        power: powerKw
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
                lastUpdated: extractText(s['fac:lastUpdated'])
            };
        }).filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));

        // Update cache
        cache.data = normalized;
        cache.lastUpdate = now;
        
        return normalized;
    } catch (error) {
        console.error('Service Error [chargerService]:', error.message);
        // Fallback to stale cache if API is down
        if (cache.data) return cache.data;
        throw error;
    }
}

module.exports = {
    getChargers
};
