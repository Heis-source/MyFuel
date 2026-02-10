'use strict';

const axios = require('axios');
const { getDistance } = require('./utils');

const MINETUR_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres';

/**
 * Fetches all fuel stations and sorts them by distance.
 * @param {number} latT Target latitude
 * @param {number} lonT Target longitude
 * @param {number} limit Max results to return
 */
async function getNearbyFuelStations(latT, lonT, limit = 10) {
    try {
        const response = await axios.get(MINETUR_URL);
        const fuelList = response.data.ListaEESSPrecio;

        return fuelList.map(s => {
            const lat = parseFloat(s['Latitud'].replace(',', '.'));
            const lon = parseFloat(s['Longitud (WGS84)'].replace(',', '.'));
            const d = getDistance(latT, lonT, lat, lon);
            return { ...s, distance: d, lat, lon };
        }).sort((a, b) => a.distance - b.distance).slice(0, limit);
    } catch (error) {
        console.error('Error fetching fuel data:', error.message);
        throw error;
    }
}

module.exports = {
    getNearbyFuelStations
};
