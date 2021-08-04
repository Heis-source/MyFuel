'use strict'

const TelegramBot = require('node-telegram-bot-api');
const mongooseConnection = require('./lib/connectMongo');
const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true })
//const {Client} = require("@googlemaps/google-maps-services-js");
//const client = new Client({});
const distance = require('google-distance-matrix');
require('dotenv').config();

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/*function finalDistanceMatrix (originLat, originLng, destLat, destLng) {
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
           const distanceFinalMatrix = response.data.rows[0].elements[0];
        })
        .catch((error)=>{
            console.log('error retrieving geocoded results' + error);
        });
}*/

bot.onText(/^\/start/, function(msg) {
    var chatId = msg.chat.id;
    var username = msg.from.username;
    bot.sendMessage(chatId, "Hola, " + username + " estoy aqui para ayudarte a encontrar tu gasolinera cercana mas barata");
});

bot.on('location', function(msg) {
    var chatId = msg.chat.id;

    mongooseConnection.collection("fuels").find({}).toArray(function(err, result) {
        if (err) throw err;

        let distanceArray = [];
        let latitudT;
        let longitudT;
        let latitud;
        let longitud;

        for (let i = 0; i < result.length; i++) {
            longitud = parseFloat(result[i]["Longitud (WGS84)"].replace(",", "."));
            latitud = parseFloat(result[i]["Latitud"].replace(",", "."));
            longitudT = parseFloat(msg.location.longitude)
            latitudT = parseFloat(msg.location.latitude)
            const infoTotal = result[i];
        
            const distanceArrayCalc = Math.sqrt((longitud - longitudT) ** 2 + (latitud - latitudT) ** 2);
            
            distanceArray.push({infoTotal, distanceArrayCalc})
        }

        distanceArray.sort(function(a, b) {
            return a.distanceArrayCalc - b.distanceArrayCalc;
        });

        for (let i = 0; i < 1; i++) {
            const finalLat = parseFloat(distanceArray[i].infoTotal["Latitud"].replace(",", "."))
            const finalLng = parseFloat(distanceArray[i].infoTotal["Longitud (WGS84)"].replace(",", "."))
            const finalAddress = capitalize(distanceArray[i].infoTotal["Dirección"]);
            const gasoleoPrice = distanceArray[i].infoTotal["Precio Gasoleo A"];
            const gasolina95Price = distanceArray[i].infoTotal["Precio Gasolina 95 E5"];
            const gasolina98Price = distanceArray[i].infoTotal["Precio Gasolina 98 E5"];

            const origins = [`${latitudT},${longitudT}`];
            const destinations = [`${latitud},${longitud}`];

            distance.key(process.env.GOOGLE_API_TOKEN);

            distance.matrix(origins, destinations, function (err, distances) {
                if (err) {
                    return console.log(err);
                }
                if(!distances) {
                    return console.log('no distances');
                }
                if (distances.status == 'OK') {
                    for (var i=0; i < origins.length; i++) {
                        for (var j = 0; j < destinations.length; j++) {
                            var origin = distances.origin_addresses[i];
                            var destination = distances.destination_addresses[j];
                            if (distances.rows[0].elements[j].status == 'OK') {
                                var distanceM = distances.rows[i].elements[j].distance.text;
                                return distanceM
                            } else {
                                console.log(destination + ' is not reachable by land from ' + origin);
                            }
                        }
                    }
                }
            });
            console.log(distance)
            bot.sendMessage(chatId,"<a href='http://www.google.com/maps/place/" + finalLat + "," + finalLng + "'>" + finalAddress + "</a>\n" + "Diesel: " + gasoleoPrice + "€    " + "G95: " + gasolina95Price + "€    " + "G98: " +  gasolina98Price + "\n", { parse_mode : "HTML", disable_web_page_preview : true });
        }
    })
})

bot.on('text', function(msg){
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, "Recuerda que tienes que enviarme la ubicacion para que pueda facilitarte la informacion.");
});