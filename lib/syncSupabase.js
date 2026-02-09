'use strict';

const axios = require('axios');
const supabase = require('./supabaseClient');
require('dotenv').config();

async function syncFuelData() {
    console.log('Starting fuel data sync...');
    try {
        const response = await axios.get('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres');
        const fuelList = response.data.ListaEESSPrecio;

        console.log(`Processing ${fuelList.length} stations...`);

        for (const fuelData of fuelList) {
            // 1. Prepare/Update Station
            const ext_id = `${fuelData['Rótulo']}-${fuelData['Dirección']}-${fuelData['C.P.']}`;

            const station = {
                ext_id: ext_id,
                name: fuelData['Rótulo'],
                brand: fuelData['Rótulo'],
                address: fuelData['Dirección'],
                latitude: parseFloat(fuelData['Latitud'].replace(',', '.')),
                longitude: parseFloat(fuelData['Longitud (WGS84)'].replace(',', '.')),
                postal_code: fuelData['C.P.'],
                province: fuelData['Provincia'],
                municipality: fuelData['Municipio']
            };

            // Upsert station
            const { data: stationData, error: stationError } = await supabase
                .from('stations')
                .upsert(station, { onConflict: 'ext_id' })
                .select();

            if (stationError) {
                console.error(`Error upserting station ${ext_id}:`, stationError);
                continue;
            }

            const dbStationId = stationData[0].id;

            // 2. Insert Prices (Historical)
            const fuelTypes = [
                { key: 'Precio Gasoleo A', label: 'Gasóleo A' },
                { key: 'Precio Gasolina 95 E5', label: 'Gasolina 95 E5' },
                { key: 'Precio Gasolina 98 E5', label: 'Gasolina 98 E5' },
                { key: 'Precio Gasoleo Premium', label: 'Gasóleo Premium' }
            ];

            const pricesToInsert = fuelTypes
                .filter(ft => fuelData[ft.key] && fuelData[ft.key] !== '')
                .map(ft => ({
                    station_id: dbStationId,
                    fuel_type: ft.label,
                    price: parseFloat(fuelData[ft.key].replace(',', '.'))
                }));

            if (pricesToInsert.length > 0) {
                const { error: priceError } = await supabase
                    .from('prices')
                    .insert(pricesToInsert);

                if (priceError) {
                    console.error(`Error inserting prices for ${ext_id}:`, priceError);
                }
            }
        }

        console.log('Fuel data sync completed successfully.');
    } catch (error) {
        console.error('Error in syncFuelData:', error);
    }
}

// If run directly
if (require.main === module) {
    syncFuelData();
}

module.exports = syncFuelData;
