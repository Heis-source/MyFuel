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

    mongooseConnection.collection("fuels").find({}).toArray(function(err, result) {
        if (err) throw err;

        let distance = [];
        let telegramMSG = [];

        for (let i = 0; i < result.length; i++) {
            const longitud = parseFloat(result[i]["Longitud (WGS84)"].replace(",", "."));
            const latitud = parseFloat(result[i]["Latitud"].replace(",", "."));
            const longitudT = parseFloat(msg.location.longitude)
            const latitudT = parseFloat(msg.location.latitude)
            const infoTotal = result[i];
        
            const distanceCalc = Math.sqrt((longitud - longitudT) ** 2 + (latitud - latitudT) ** 2);
            
            distance.push({infoTotal, distanceCalc})
        }

        distance.sort(function(a, b) {
            return a.distanceCalc - b.distanceCalc;
        });

        console.log(distance);

        for (let i = 0; i < 5; i++) {
            console.log(distance[i]);
            console.log(parseFloat(msg.location.latitude))
            console.log(parseFloat(msg.location.longitude))
            //bot.sendMessage(chatId, "Direccion:\n<a href='http://www.google.com/maps/place/" + distance[i].infoTotal["Latitud"].replace(",", ".") + "," + distance[i].infoTotal["Longitud (WGS84)"].replace(",", ".") + "'>" + distance[i].infoTotal["Dirección"] + "</a>" , { parse_mode : "HTML", disable_web_page_preview : true });
        }
    })
})

bot.on('text', function(msg){
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, "Recuerda que tienes que enviarme la ubicacion para que pueda facilitarte la informacion.");
});