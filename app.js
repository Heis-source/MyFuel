'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

function parseCsvEnv(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}

const allowedOrigins = parseCsvEnv(process.env.ALLOWED_ORIGINS);
const allowAllCors =
  process.env.CORS_ALLOW_ALL === 'true' ||
  (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0);

if (process.env.NODE_ENV === 'production' && !allowAllCors && allowedOrigins.length === 0) {
  console.warn('[security] ALLOWED_ORIGINS is empty. Browser cross-origin requests will be rejected.');
}

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  if ((req.secure || req.headers['x-forwarded-proto'] === 'https') && process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});

// Configurar CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowAllCors) {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  } else if (origin) {
    if (req.method === 'OPTIONS') return res.sendStatus(403);
    return res.status(403).json({ success: false, error: 'Origen no permitido' });
  }

  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
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
