'use strict'

const mongooseConnection = require('../../lib/connectMongo');
const cron = require('node-cron');
const express = require('express');
const router = express.Router();
const FuelSchema = require('../../models/info');
const axios = require('axios');
require('dotenv').config();


cron.schedule('15 * * * * *', () => {
    console.log("Exec")
    axios.get('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres')
        .then(response => {
            onSuccess(response);
        })
        .catch(error => {
            console.log(error);
        });

    function onSuccess(response) {

        mongooseConnection.collection("fuels").drop();
        console.log("Hola");

        let fuelInfoFull = response.data.ListaEESSPrecio
        let fuelInfoLength = Object.keys(fuelInfoFull).length;

        for (var i = 0; i < fuelInfoLength; i++) {
            let fuelData = fuelInfoFull[i];

            assignDataValue(fuelData);
        }
    }

    function assignDataValue(fuelData) {

        const upData = new FuelSchema(fuelData)
            upData.Fecha = Date.now();

        upData.save();
    }
});

module.exports = router;