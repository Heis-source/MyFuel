'use strict'

const mongooseConnection = require('../../lib/connectMongo');
const cron = require('node-cron');
const express = require('express');
const router = express.Router();
const FuelSchema = require('../../models/info');
const axios = require('axios');
require('dotenv').config();

cron.schedule('15 * * * * *', async () => {
    console.log("Exec")
    try {
        const response = await axios.get('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres');
        
        try {
            await mongooseConnection.collection("fuels").drop();
        } catch (dropErr) {
            // NamespaceNotFound is fine, it means the collection didn't exist
            if (dropErr.code !== 26) {
                console.error("Error dropping collection:", dropErr);
            }
        }

        console.log("Updating fuel data...");

        let fuelInfoFull = response.data.ListaEESSPrecio;
        let fuelInfoLength = Object.keys(fuelInfoFull).length;

        for (var i = 0; i < fuelInfoLength; i++) {
            let fuelData = fuelInfoFull[i];
            const upData = new FuelSchema(fuelData);
            upData.Fecha = Date.now();
            await upData.save();
        }
        console.log("Fuel data updated successfully.");
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});

module.exports = router;