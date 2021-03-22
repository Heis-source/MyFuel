'use strict';

const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res, next) => {
    try {

        const Prov = req.params.pro
        console.log(Prov)

    } catch (err) {
        next(err);
    }
})

module.exports = router;