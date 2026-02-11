'use strict';

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const { handleStart, handleLocation, handleText } = require('./lib/botHandlers');

// --- Iniciar Bot de Telegram ---
const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true });

bot.onText(/^\/start/, (msg) => handleStart(bot, msg));
bot.on('location', (msg) => handleLocation(bot, msg));
bot.on('text', (msg) => handleText(bot, msg));

console.log('--- Bot MyFuel iniciado ---');
console.log('Escuchando comandos y ubicaciones...');

// --- Iniciar Servidor Express (API) ---
const app = require('./app');
const http = require('http');
const port = process.env.PORT || '3000';
app.set('port', port);
const server = http.createServer(app);

server.listen(port, '0.0.0.0', () => {
    console.log(`--- API MyFuel iniciada en puerto ${port} ---`);
    console.log(`URL: http://localhost:${port}`);
});

server.on('error', (error) => {
    if (error.syscall !== 'listen') throw error;
    console.error(`Error al iniciar servidor en puerto ${port}: ${error.code}`);
});
