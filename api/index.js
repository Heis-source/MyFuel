'use strict';

require('dotenv').config();

const { Telegraf } = require('telegraf');
const { handleStart, handleLocation, handleText } = require('./lib/botHandlers');

// --- Iniciar Bot de Telegram ---
const telegramToken = process.env.TELEGRAM_API_TOKEN;
let bot = null;

if (!telegramToken) {
    console.warn('[telegram] TELEGRAM_API_TOKEN no definido. El bot no se iniciará.');
} else {
    bot = new Telegraf(telegramToken);

    bot.start((ctx) => handleStart(ctx));
    bot.on('location', (ctx) => handleLocation(ctx));
    bot.on('text', (ctx) => handleText(ctx));

    bot.catch((err, ctx) => {
        const chatId = ctx?.chat?.id || 'unknown';
        console.error(`[telegram] Error procesando update para chat ${chatId}:`, err.message);
    });

    bot.launch({ dropPendingUpdates: true })
        .then(() => {
            console.log('--- Bot MyFuel iniciado con Telegraf ---');
            console.log('Escuchando comandos y ubicaciones...');
        })
        .catch((err) => {
            console.error('[telegram] No se pudo iniciar el bot:', err.message);
        });

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

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
