'use strict'

const TelegramBot = require('node-telegram-bot-api');
const FuelSchema = require('./models/info');
const mongooseConnection = require('./lib/connectMongo');
const {Client} = require("@googlemaps/google-maps-services-js");
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true })
const client = new Client({});

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function finalDistanceMatrix (originLat, originLng, destLat, destLng) {
    client
        .distancematrix({
            params: {
                origins: [{ lat: originLat, lng: originLng }],
                destinations: [{ lat: destLat, lng: destLng }],
                key: process.env.GOOGLE_API_TOKEN,
            },
            timeout: 1000, // milliseconds
        })
        .then((response) => {
            response.data;
        })
}

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
        let longitudT;
        let latitudT;
        let longitud;
        let latitud;

        for (let i = 0; i < result.length; i++) {
            longitud = parseFloat(result[i]["Longitud (WGS84)"].replace(",", "."));
            latitud = parseFloat(result[i]["Latitud"].replace(",", "."));
            longitudT = parseFloat(msg.location.longitude)
            latitudT = parseFloat(msg.location.latitude)
            const infoTotal = result[i];
        
            const distanceCalc = Math.sqrt((longitud - longitudT) ** 2 + (latitud - latitudT) ** 2);
            
            distance.push({infoTotal, distanceCalc})
        }

        distance.sort(function(a, b) {
            return a.distanceCalc - b.distanceCalc;
        });

        for (let i = 0; i < 1; i++) {
            const finalLat = parseFloat(distance[i].infoTotal["Latitud"].replace(",", "."))
            const finalLng = parseFloat(distance[i].infoTotal["Longitud (WGS84)"].replace(",", "."))
            const finalAddress = capitalize(distance[i].infoTotal["Dirección"]);
            const gasoleoPrice = distance[i].infoTotal["Precio Gasoleo A"];
            const gasolina95Price = distance[i].infoTotal["Precio Gasolina 95 E5"];
            const gasolina98Price = distance[i].infoTotal["Precio Gasolina 98 E5"];
            const distanceMatrixData = finalDistanceMatrix(latitudT, longitudT, finalLat, finalLng);

            console.log(distanceMatrixData);

            bot.sendMessage(chatId,"<a href='http://www.google.com/maps/place/" + finalLat + "," + finalLng + "'>" + finalAddress + "</a>\n" + "Diesel: " + gasoleoPrice + "€    " + "G95: " + gasolina95Price + "€    " + "G98: " +  gasolina98Price + "\n", { parse_mode : "HTML", disable_web_page_preview : true });
        }
    })
})

bot.on('text', function(msg){
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, "Recuerda que tienes que enviarme la ubicacion para que pueda facilitarte la informacion.");
});