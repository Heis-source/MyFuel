'use strict'

const TelegramBot = require('node-telegram-bot-api');
const { handleStart, handleLocation, handleText } = require('./lib/botHandlers');
require('dotenv').config();

// Initialize the bot
const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true });

// Register Event Handlers
bot.onText(/^\/start/, (msg) => handleStart(bot, msg));
bot.on('location', (msg) => handleLocation(bot, msg));
bot.on('text', (msg) => handleText(bot, msg));

console.log('--- Bot MyFuel (Refactorizado) iniciado ---');
console.log('Escuchando comandos y ubicaciones...');
