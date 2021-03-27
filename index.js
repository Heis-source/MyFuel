'use strict'

const TelegramBot = require('node-telegram-bot-api');
const FuelSchema = require('./models/info');
const mongooseConnection = require('./lib/connectMongo');

require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true })

bot.onText(/^\/start/, function(msg){
    var chatId = msg.chat.id;
    var username = msg.from.username;
    bot.sendMessage(chatId, "Hola, " + username + " estoy aqui para ayudarte a encontrar tu gasolinera cercana mas barata");
});

bot.on('location', function(msg){
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, "Dejame un momento, ahora te paso la ubicacion.");

    mongooseConnection.collection("fuels").find({}).toArray(function(err, result) {
        if (err) throw err;

        let distance = [];
        let telegramMSG = [];

        for (let i = 0; i < result.length; i++) {
            const longitud = parseFloat(result[i]["Longitud (WGS84)"].replace(",", "."));
            const latitud = parseFloat(result[i]["Latitud"].replace(",", "."));
            const longitudT = parseFloat(msg.location.latitude)
            const latitudT = parseFloat(msg.location.latitude)
            const _id = result[i]["_id"];

            function rad (x) {
                return x * Math.PI / 180;
            }
        
            const R = 6378.137;//Radio de la tierra en km
            const dLat = rad(parseFloat(latitudT - latitud));
            const dLong = rad(parseFloat(longitudT - longitud));
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(latitud)) * Math.cos(rad(latitudT)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c;
            const distanceCalc = d.toFixed(10);//Retorna tres decimale
            
            distance.push({_id, distanceCalc})
        }

        distance.sort(function(a, b) {
            return a.distanceCalc - b.distanceCalc;
        });

        for (let i = 0; i < 5; i++) {
            let toSearch = distance[i]['_id']
            mongooseConnection.collection("fuels").findOne({ _id: toSearch }).toArray(function(err, result) { 
                telegramMSG.push(result);
            })
            
            console.log(telegramMSG)
        }
    })
})

bot.on('text', function(msg){
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, "Recuerda que tienes que enviarme la ubicacion para que pueda facilitarte la informacion.");
});