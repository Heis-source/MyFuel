'use strict';

const axios = require('axios');
const supabase = require('./supabaseClient');
const chargerService = require('./chargerService');
const { capitalize, getDistance, formatDistance } = require('./utils');

const FUEL_TYPES = {
    'Precio Gasolina 95 E5': 'G95 E5',
    'Precio Gasolina 95 E10': 'G95 E10',
    'Precio Gasolina 95 E5 Premium': 'G95 Prem',
    'Precio Gasolina 98 E5': 'G98 E5',
    'Precio Gasolina 98 E10': 'G98 E10',
    'Precio Gasoleo A': 'Gasóleo A',
    'Precio Gasoleo B': 'Gasóleo B',
    'Precio Gasoleo Premium': 'G. Premium',
    'Precio Biodiesel': 'Biodiesel',
    'Precio Bioetanol': 'Bioetanol',
    'Precio Gas Natural Comprimido': 'GNC',
    'Precio Gas Natural Licuado': 'GNL',
    'Precio Gases licuados del petróleo': 'GLP',
    'Precio Hidrogeno': 'Hidrógeno'
};

/**
 * Saves a station and its current prices to Supabase history.
 * @param {Object} s Station data from DGT/Ministry
 */
async function saveToHistory(s) {
    try {
        const ext_id = `${s['Rótulo']}-${s['Dirección']}-${s['C.P.']}`;

        const { data: stationData, error: sErr } = await supabase
            .from('stations')
            .upsert({
                ext_id,
                name: s['Rótulo'],
                brand: s['Rótulo'],
                address: s['Dirección'],
                latitude: s.lat,
                longitude: s.lon,
                postal_code: s['C.P.'],
                province: s['Provincia'],
                municipality: s['Municipio']
            }, { onConflict: 'ext_id' })
            .select();

        if (sErr) throw sErr;
        const dbId = stationData[0].id;

        const pricesToInsert = [];
        for (const [apiKey, readableName] of Object.entries(FUEL_TYPES)) {
            const val = s[apiKey];
            if (val && val.trim() !== '') {
                pricesToInsert.push({
                    station_id: dbId,
                    fuel_type: readableName,
                    price: parseFloat(val.replace(',', '.'))
                });
            }
        }

        if (pricesToInsert.length > 0) {
            await supabase.from('prices').insert(pricesToInsert);
        }
    } catch (error) {
        console.error("History log error:", error.message);
    }
}

/**
 * Handler for the /start command.
 */
function handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const username = msg.from.username || msg.from.first_name;
    const opts = {
        reply_markup: {
            keyboard: [[{
                text: "📍 Enviar mi ubicación",
                request_location: true
            }]],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    bot.sendMessage(chatId, `¡Hola, ${username}! Pulsa el botón de abajo para enviarme tu ubicación y te daré los precios de gasolina y cargadores en tiempo real.`, opts);
}

/**
 * Handler for location messages.
 */
async function handleLocation(bot, msg) {
    const chatId = msg.chat.id;
    const latT = msg.location.latitude;
    const lonT = msg.location.longitude;

    try {
        bot.sendMessage(chatId, "Consultando todos los precios y cargadores oficiales...");

        const [fuelResponse, chargers] = await Promise.all([
            axios.get('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres'),
            chargerService.getChargers()
        ]);

        const fuelList = fuelResponse.data.ListaEESSPrecio;

        // Process Closest Gas Stations
        const closestStations = fuelList.map(s => {
            const lat = parseFloat(s['Latitud'].replace(',', '.'));
            const lon = parseFloat(s['Longitud (WGS84)'].replace(',', '.'));
            const d = getDistance(latT, lonT, lat, lon);
            return { ...s, distance: d, lat, lon };
        }).sort((a, b) => a.distance - b.distance).slice(0, 3);

        // Process Closest EV Chargers
        const closestChargers = chargers.map(c => {
            const d = getDistance(latT, lonT, c.latitude, c.longitude);
            return { ...c, distance: d };
        }).sort((a, b) => a.distance - b.distance).slice(0, 3);

        let responseMsg = "<b>⛽️ Gasolineras cercanas:</b>\n\n";

        for (const s of closestStations) {
            const finalAddress = capitalize(s['Dirección']);
            const brand = s['Rótulo'];
            const distStr = formatDistance(s.distance);
            
            responseMsg += `📍 <a href='http://www.google.com/maps/place/${s.lat},${s.lon}'><b>${brand}</b></a> (a ${distStr})\n`;
            responseMsg += `<i>${finalAddress}</i>\n`;

            let hasPrices = false;
            for (const [apiKey, readableName] of Object.entries(FUEL_TYPES)) {
                const price = s[apiKey];
                if (price && price.trim() !== '') {
                    responseMsg += ` ▪️ ${readableName}: <b>${price}€</b>\n`;
                    hasPrices = true;
                }
            }

            if (!hasPrices) responseMsg += " ▪️ Precios no disponibles\n";
            responseMsg += "\n";

            saveToHistory(s); // Fire and forget
        }

        responseMsg += "<b>⚡️ Cargadores Eléctricos cercanos:</b>\n\n";

        for (const c of closestChargers) {
            const distStr = formatDistance(c.distance);
            const finalAddress = c.address || `CP ${c.postcode}`;
            const name = c.name || 'Cargador';

            responseMsg += `🔋 <a href='http://www.google.com/maps/place/${c.latitude},${c.longitude}'><b>${name}</b></a> (a ${distStr})\n`;
            responseMsg += `<i>${finalAddress}</i>\n`;
            
            if (c.connectors && c.connectors.length > 0) {
                // Simplify connector names and show power
                const connStr = c.connectors.slice(0, 4).map(conn => {
                    let type = conn.type ? conn.type.replace('iec62196', '').replace('COMBO', ' Combo') : 'Desconocido';
                    return `▪️ ${type}: <b>${conn.power}kW</b>`;
                }).join('\n');
                responseMsg += `${connStr}\n`;
            } else {
                responseMsg += " ▪️ Información de conectores no disp.\n";
            }
            responseMsg += "\n";
        }

        const opts = {
            parse_mode: "HTML",
            disable_web_page_preview: true
        };

        bot.sendMessage(chatId, responseMsg, opts);

    } catch (err) {
        console.error("Error in bot processing:", err);
        bot.sendMessage(chatId, "Lo siento, hubo un error al consultar los datos.");
    }
}

/**
 * Handler for generic text messages.
 */
function handleText(bot, msg) {
    if (msg.text.startsWith('/')) return;
    bot.sendMessage(msg.chat.id, "Envíame tu ubicación para ver los precios detallados de combustible y cargadores.");
}

module.exports = {
    handleStart,
    handleLocation,
    handleText
};
