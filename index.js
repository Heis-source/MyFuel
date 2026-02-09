'use strict'

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const supabase = require('./lib/supabaseClient');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true });

// Mapping of API keys to readable names
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

function capitalize(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Haversine formula for accurate distance in kilometers
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function formatDistance(distKm) {
    if (distKm < 1) {
        return `${Math.round(distKm * 1000)}m`;
    }
    return `${distKm.toFixed(2)}km`;
}

bot.onText(/^\/start/, function (msg) {
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
    bot.sendMessage(chatId, "¡Hola, " + username + "! Pulsa el botón de abajo para enviarme tu ubicación y te daré los precios en tiempo real.", opts);
});

bot.on('location', async function (msg) {
    const chatId = msg.chat.id;
    const latT = msg.location.latitude;
    const lonT = msg.location.longitude;

    try {
        bot.sendMessage(chatId, "Consultando todos los precios oficiales...");

        const response = await axios.get('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres');
        const fuelList = response.data.ListaEESSPrecio;

        const closestStations = fuelList.map(s => {
            const lat = parseFloat(s['Latitud'].replace(',', '.'));
            const lon = parseFloat(s['Longitud (WGS84)'].replace(',', '.'));
            const d = getDistance(latT, lonT, lat, lon);
            return { ...s, distance: d, lat, lon };
        }).sort((a, b) => a.distance - b.distance).slice(0, 3);

        let responseMsg = "<b>Precios Detallados V2 (Tiempo Real)</b>\n\n";

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
                    console.log(`Found ${readableName}: ${price}`);
                    responseMsg += ` ▪️ ${readableName}: <b>${price}€</b>\n`;
                    hasPrices = true;
                }
            }

            if (!hasPrices) responseMsg += " ▪️ Precios no disponibles\n";
            responseMsg += "\n";

            // Log all found prices to history
            saveToHistory(s).catch(err => console.error("History log error:", err));
        }

        const opts = {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: {
                keyboard: [[{
                    text: "📍 Enviar ubicación de nuevo",
                    request_location: true
                }]],
                resize_keyboard: true
            }
        };

        bot.sendMessage(chatId, responseMsg, opts);

    } catch (err) {
        console.error("Error in bot processing:", err);
        bot.sendMessage(chatId, "Lo siento, hubo un error consultando los datos completos.");
    }
});

async function saveToHistory(s) {
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
}

bot.on('text', function (msg) {
    if (msg.text.startsWith('/')) return;
    bot.sendMessage(msg.chat.id, "Envíame tu ubicación para ver los precios detallados.");
});

console.log('Bot Detallado iniciado...');