'use strict'

const TelegramBot = require('node-telegram-bot-api');
const mongooseConnection = require('./lib/connectMongo');
const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true })
const distance = require('google-distance-matrix');
require('dotenv').config();
const chargerService = require('./lib/chargerService');

function capitalize(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

bot.onText(/^\/start/, function(msg) {
    var chatId = msg.chat.id;
    var username = msg.from.username;
    bot.sendMessage(chatId, "Hola, " + username + " estoy aqui para ayudarte a encontrar tu gasolinera o cargador cercano");
});

bot.on('location', async function(msg) {
    const chatId = msg.chat.id;
    const latT = parseFloat(msg.location.latitude);
    const lonT = parseFloat(msg.location.longitude);

    try {
        // Fetch both fuels and chargers in parallel
        const [fuels, chargers] = await Promise.all([
            mongooseConnection.collection("fuels").find({}).toArray(),
            chargerService.getChargers()
        ]);

        // --- Process Fuels ---
        let fuelArray = fuels.map(infoTotal => {
            const lon = parseFloat(infoTotal["Longitud (WGS84)"].replace(",", "."));
            const lat = parseFloat(infoTotal["Latitud"].replace(",", "."));
            const distance = Math.sqrt((lon - lonT) ** 2 + (lat - latT) ** 2);
            return { infoTotal, distance };
        }).sort((a, b) => a.distance - b.distance);

        // --- Process Chargers ---
        let chargerArray = chargers.map(infoTotal => {
            const lon = parseFloat(infoTotal.longitude);
            const lat = parseFloat(infoTotal.latitude);
            const distance = Math.sqrt((lon - lonT) ** 2 + (lat - latT) ** 2);
            return { infoTotal, distance };
        }).sort((a, b) => a.distance - b.distance);

        let responseMsg = "<b>Gasolineras cercanas:</b>\n";
        
        // Show closest 3 gas stations
        for (let i = 0; i < Math.min(3, fuelArray.length); i++) {
            const f = fuelArray[i].infoTotal;
            const finalLat = parseFloat(f["Latitud"].replace(",", "."));
            const finalLng = parseFloat(f["Longitud (WGS84)"].replace(",", "."));
            const finalAddress = capitalize(f["Dirección"]);
            const gasoleoPrice = f["Precio Gasoleo A"] || 'N/A';
            const gasolina95Price = f["Precio Gasolina 95 E5"] || 'N/A';
            const rotulo = f["Rótulo"];
            
            responseMsg += `<a href='http://www.google.com/maps/place/${finalLat},${finalLng}'>${rotulo} - ${finalAddress}</a>\n`;
            responseMsg += `Diesel: ${gasoleoPrice}€  G95: ${gasolina95Price}€\n\n`;
        }

        responseMsg += "\n<b>Cargadores Eléctricos cercanos:</b>\n";
        
        // Show closest 3 chargers
        for (let i = 0; i < Math.min(3, chargerArray.length); i++) {
            const c = chargerArray[i].infoTotal;
            const finalAddress = c.address || `CP ${c.postcode}`;
            const name = c.name || 'Cargador';
            
            responseMsg += `<a href='http://www.google.com/maps/place/${c.latitude},${c.longitude}'>${name}</a>\n`;
            responseMsg += `${finalAddress}\n`;
            if (c.connectors && c.connectors.length > 0) {
                const connStr = c.connectors.map(conn => `${conn.type} (${conn.power}kW)`).join(', ');
                responseMsg += `Conectores: ${connStr}\n`;
            }
            responseMsg += "\n";
        }

        bot.sendMessage(chatId, responseMsg, { 
            parse_mode: "HTML", 
            disable_web_page_preview: true 
        });

    } catch (err) {
        console.error("Error processing location:", err);
        bot.sendMessage(chatId, "Lo siento, ha ocurrido un error al buscar la información.");
    }
});

bot.on('text', function(msg){
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, "Recuerda que tienes que enviarme la ubicacion para que pueda facilitarte la informacion.");
});