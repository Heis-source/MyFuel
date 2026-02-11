'use strict';

const axios = require('axios');
const { getDistance } = require('./utils');

const MINETUR_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres';

/**
 * Cache en memoria para evitar descargar 12.000+ gasolineras en cada petición.
 * TTL: 30 minutos.
 */
let cache = {
    data: null,
    lastUpdate: 0
};
const CACHE_DURATION = 30 * 60 * 1000;

/**
 * Obtiene las gasolineras más cercanas a unas coordenadas.
 * @param {number} latT Latitud objetivo
 * @param {number} lonT Longitud objetivo
 * @param {number} limit Máximo de resultados
 */
async function getNearbyFuelStations(latT, lonT, limit = 10) {
    try {
        const now = Date.now();
        let fuelList;

        // Usar caché si es válido
        if (cache.data && (now - cache.lastUpdate < CACHE_DURATION)) {
            fuelList = cache.data;
        } else {
            const response = await axios.get(MINETUR_URL, { timeout: 30000 });
            fuelList = response.data.ListaEESSPrecio;
            cache.data = fuelList;
            cache.lastUpdate = now;
            console.log(`[fuelService] Caché actualizado: ${fuelList.length} gasolineras`);
        }

        return fuelList.map(s => {
            const lat = parseFloat(s['Latitud'].replace(',', '.'));
            const lon = parseFloat(s['Longitud (WGS84)'].replace(',', '.'));
            const d = getDistance(latT, lonT, lat, lon);
            return { ...s, distance: d, lat, lon };
        }).sort((a, b) => a.distance - b.distance).slice(0, limit);
    } catch (error) {
        console.error('Error fetching fuel data:', error.message);
        // Si hay caché aunque esté expirado, usarlo como fallback
        if (cache.data) {
            console.log('[fuelService] Usando caché expirado como fallback');
            return cache.data.map(s => {
                const lat = parseFloat(s['Latitud'].replace(',', '.'));
                const lon = parseFloat(s['Longitud (WGS84)'].replace(',', '.'));
                const d = getDistance(latT, lonT, lat, lon);
                return { ...s, distance: d, lat, lon };
            }).sort((a, b) => a.distance - b.distance).slice(0, limit);
        }
        throw error;
    }
}

module.exports = {
    getNearbyFuelStations
};
