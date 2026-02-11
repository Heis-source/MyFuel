'use strict';

const express = require('express');
const router = express.Router();
const fuelService = require('../../lib/fuelService');
const chargerService = require('../../lib/chargerService');

/**
 * GET /apiv1/nearby
 * Returns top 5 fuel stations and top 5 EV chargers sorted by distance.
 * Query params: lat, lon
 */
router.get('/', async (req, res, next) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        }

        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        const [fuelStations, chargers] = await Promise.all([
            fuelService.getNearbyFuelStations(latNum, lonNum, 20),
            chargerService.getChargers()
        ]);

        // Process chargers (already normalized by service, just need to calculate distance and sort)
        const nearbyChargers = chargers.map(c => {
            const { getDistance } = require('../../lib/utils');
            const d = getDistance(latNum, lonNum, c.latitude, c.longitude);
            return { ...c, distance: d };
        }).sort((a, b) => a.distance - b.distance).slice(0, 20);

        res.json({
            success: true,
            results: {
                fuelStations,
                chargers: nearbyChargers
            }
        });
    } catch (err) {
        console.error('API Error /nearby:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
