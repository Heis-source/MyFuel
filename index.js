'use strict'

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

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

    axios.get('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres')
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
            console.log(error);
        });
});

bot.on('text', function(msg){
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, "Recuerda que tienes que enviarme la ubicacion para que pueda facilitarte la informacion.");
});