'use strict';

const express = require('express');
const router = express.Router();
const fuelService = require('../../lib/fuelService');
const chargerService = require('../../lib/chargerService');
const { getDistance } = require('../../lib/utils');
const { createRateLimiter, toPositiveInt } = require('../../lib/rateLimiter');

const MAX_RESULTS = 20;
const nearbyRateLimiter = createRateLimiter({
    keyPrefix: 'nearby',
    windowMs: toPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    max: toPositiveInt(process.env.RATE_LIMIT_NEARBY_MAX, 60)
});

function parseCoordinate(rawValue, label, min, max) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return { error: `${label} inválida` };
    if (value < min || value > max) return { error: `${label} fuera de rango` };
    return { value };
}

/**
 * GET /apiv1/nearby
 * Devuelve las gasolineras y cargadores EV más cercanos ordenados por distancia.
 * Query params: lat, lon
 */
router.get('/', nearbyRateLimiter, async (req, res, next) => {
    try {
        const { lat, lon } = req.query;

        if (lat === undefined || lon === undefined) {
            return res.status(400).json({ success: false, error: 'Se requieren latitud y longitud' });
        }

        const parsedLat = parseCoordinate(lat, 'Latitud', -90, 90);
        if (parsedLat.error) {
            return res.status(400).json({ success: false, error: parsedLat.error });
        }

        const parsedLon = parseCoordinate(lon, 'Longitud', -180, 180);
        if (parsedLon.error) {
            return res.status(400).json({ success: false, error: parsedLon.error });
        }

        const latNum = parsedLat.value;
        const lonNum = parsedLon.value;

        const [fuelStations, chargers] = await Promise.all([
            fuelService.getNearbyFuelStations(latNum, lonNum, MAX_RESULTS),
            chargerService.getChargers()
        ]);

        // Calcular distancia de cargadores y ordenar
        // Nota: chargerService ya normaliza latitude/longitude a number y filtra inválidos.
        const nearbyChargers = chargers
            .map((c) => {
                const d = getDistance(latNum, lonNum, c.latitude, c.longitude);
                return { ...c, distance: d };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, MAX_RESULTS);

        res.json({
            success: true,
            results: {
                fuelStations,
                chargers: nearbyChargers
            }
        });
    } catch (err) {
        console.error('API Error /nearby:', err);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

module.exports = router;
