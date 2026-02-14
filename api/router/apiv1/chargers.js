'use strict';

const express = require('express');
const router = express.Router();
const chargerService = require('../../lib/chargerService');
const { createRateLimiter, toPositiveInt } = require('../../lib/rateLimiter');

const chargersRateLimiter = createRateLimiter({
    keyPrefix: 'chargers',
    windowMs: toPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    max: toPositiveInt(process.env.RATE_LIMIT_CHARGERS_MAX, 30)
});

/**
 * GET /apiv1/chargers
 * Returns a list of all EV charging stations in Spain.
 */
router.get('/', chargersRateLimiter, async (req, res, next) => {
    try {
        const chargers = await chargerService.getChargers();
        res.json({ success: true, count: chargers.length, result: chargers });
    } catch (err) {
        console.error('API Error /chargers:', err);
        res.status(500).json({ success: false, error: 'Could not fetch chargers data' });
    }
});

module.exports = router;
