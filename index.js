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

// --- Start Express Server ---
const app = require('./app');
const http = require('http');
const port = process.env.PORT || '3000';
app.set('port', port);
const server = http.createServer(app);

server.listen(port, '0.0.0.0', () => {
    console.log(`--- Servidor Web MyFuel iniciado en puerto ${port} ---`);
    console.log(`Acceso Local: http://localhost:${port}`);
    console.log(`Acceso Red: http://192.168.0.56:${port}`);
});

server.on('error', (error) => {
    if (error.syscall !== 'listen') throw error;
    console.error(`Error al iniciar servidor en puerto ${port}: ${error.code}`);
});
