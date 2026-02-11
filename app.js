'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();

// Configurar cabeceras y CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.locals.title = 'MyFuel';

// --- Rutas API ---
app.use('/apiv1/chargers', require('./router/apiv1/chargers'));
app.use('/apiv1/nearby', require('./router/apiv1/nearby'));

// Ruta raíz informativa (no es un frontend, solo confirma que la API está activa)
app.get('/', (req, res) => {
  res.json({
    name: 'MyFuel API',
    version: '1.0.0',
    endpoints: [
      'GET /apiv1/nearby?lat=<lat>&lon=<lon>',
      'GET /apiv1/chargers'
    ],
    status: 'ok'
  });
});

// Manejo de errores — respuesta JSON (sin vistas HTML)
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  });
});

module.exports = app;
