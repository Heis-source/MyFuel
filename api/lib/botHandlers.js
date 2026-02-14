'use strict';

const supabase = require('./supabaseClient');
const fuelService = require('./fuelService');
const chargerService = require('./chargerService');
const { capitalize, getDistance, formatDistance, escapeHtml } = require('./utils');

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
    if (!supabase) return;

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
async function handleStart(ctx) {
    const username = ctx.from?.username || ctx.from?.first_name || 'usuario';
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
    await ctx.reply(`¡Hola, ${username}! Pulsa el botón de abajo para enviarme tu ubicación y te daré los precios de gasolina y cargadores en tiempo real.`, opts);
}

/**
 * Handler for location messages.
 */
async function handleLocation(ctx) {
    const location = ctx.message?.location;
    if (!location) return;

    const latT = location.latitude;
    const lonT = location.longitude;

    try {
        await ctx.reply("Consultando todos los precios y cargadores oficiales...");

        const [fuelStations, chargers] = await Promise.all([
            fuelService.getNearbyFuelStations(latT, lonT, 3),
            chargerService.getChargers()
        ]);

        // Process Closest Gas Stations (already processed by service)
        const closestStations = fuelStations;

        // Process Closest EV Chargers
        const closestChargers = chargers.map(c => {
            const d = getDistance(latT, lonT, c.latitude, c.longitude);
            return { ...c, distance: d };
        }).sort((a, b) => a.distance - b.distance).slice(0, 3);

        let responseMsg = "<b>⛽️ Gasolineras cercanas:</b>\n\n";

        for (const s of closestStations) {
            const stationLat = Number(s.lat);
            const stationLon = Number(s.lon);
            if (!Number.isFinite(stationLat) || !Number.isFinite(stationLon)) continue;

            const finalAddress = escapeHtml(capitalize(s['Dirección']));
            const brand = escapeHtml(String(s['Rótulo'] || 'Gasolinera'));
            const distStr = formatDistance(s.distance);
            const stationMapUrl = `https://www.google.com/maps/place/${stationLat},${stationLon}`;

            responseMsg += `📍 <a href='${stationMapUrl}'><b>${brand}</b></a> (a ${distStr})\n`;
            responseMsg += `<i>${finalAddress}</i>\n`;

            let hasPrices = false;
            for (const [apiKey, readableName] of Object.entries(FUEL_TYPES)) {
                const price = s[apiKey];
                if (price && price.trim() !== '') {
                    const safePrice = escapeHtml(price);
                    responseMsg += ` ▪️ ${readableName}: <b>${safePrice}€</b>\n`;
                    hasPrices = true;
                }
            }

            if (!hasPrices) responseMsg += " ▪️ Precios no disponibles\n";
            responseMsg += "\n";

            saveToHistory(s); // Fire and forget
        }

        responseMsg += "<b>⚡️ Cargadores Eléctricos cercanos:</b>\n\n";

        for (const c of closestChargers) {
            const chargerLat = Number(c.latitude);
            const chargerLon = Number(c.longitude);
            if (!Number.isFinite(chargerLat) || !Number.isFinite(chargerLon)) continue;

            const distStr = formatDistance(c.distance);
            const finalAddress = escapeHtml(c.address || `CP ${c.postcode}`);
            const name = escapeHtml(c.name || 'Cargador');
            const chargerMapUrl = `https://www.google.com/maps/place/${chargerLat},${chargerLon}`;

            responseMsg += `🔋 <a href='${chargerMapUrl}'><b>${name}</b></a> (a ${distStr})\n`;
            responseMsg += `<i>${finalAddress}</i>\n`;
            
            if (c.connectors && c.connectors.length > 0) {
                // Simplify connector names and show power
                const connStr = c.connectors.slice(0, 4).map(conn => {
                    let type = conn.type ? conn.type.replace('iec62196', '').replace('COMBO', ' Combo') : 'Desconocido';
                    const safeType = escapeHtml(type);
                    const safePower = escapeHtml(String(conn.power ?? '?'));
                    return `▪️ ${safeType}: <b>${safePower}kW</b>`;
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

        await ctx.reply(responseMsg, opts);

    } catch (err) {
        console.error("Error in bot processing:", err);
        await ctx.reply("Lo siento, hubo un error al consultar los datos.");
    }
}

/**
 * Handler for generic text messages.
 */
async function handleText(ctx) {
    const text = ctx.message?.text;
    if (typeof text !== 'string' || text.startsWith('/')) return;
    await ctx.reply("Envíame tu ubicación para ver los precios detallados de combustible y cargadores.");
}

module.exports = {
    handleStart,
    handleLocation,
    handleText
};
