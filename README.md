# MyFuel

MyFuel es una aplicación Node.js que combina un servidor Express y un bot de Telegram para ayudarte a encontrar las gasolineras más baratas cercanas. Utiliza datos abiertos del Ministerio para consultar los precios y los almacena en MongoDB.

## Requisitos

- Node.js
- MongoDB en ejecución

## Instalación

```bash
npm install
```

Crea un archivo `.env` en la raíz con las siguientes variables:

```
MONGODB_CONNECTION=<cadena de conexión de MongoDB>
TELEGRAM_API_TOKEN=<token del bot de Telegram>
GOOGLE_API_TOKEN=<token de Google (opcional)>
PORT=<puerto opcional para Express>
```

## Puesta en marcha

En desarrollo puedes ejecutar:

```bash
npm run dev
```

Para producción:

```bash
npm start
```

El bot de Telegram se lanza desde `index.js`. Si se desea ejecutarlo de forma independiente:

```bash
node index.js
```

## ¿Qué hace cada página?

El proyecto utiliza plantillas jade/ejs muy sencillas:

- `views/layout.jade`: plantilla base con la cabecera de la página.
- `views/index.jade`: página de inicio con un saludo sencillo.
- `views/error.jade`: muestra los errores de Express.

Todo el estilo se encuentra en `public/stylesheets/style.css`.

## Funcionamiento

- Un cron en `router/apiv1/data.js` descarga cada minuto la información de precios y la guarda en MongoDB.
- `index.js` gestiona un bot de Telegram que, al recibir tu ubicación, calcula cuál es la gasolinera más cercana y devuelve un enlace de Google Maps junto con los precios de combustible.
- El servidor Express configurado en `app.js` sirve las páginas estáticas y ejecuta la ruta del cron.

Con esto ya tienes todo lo necesario para arrancar y probar **MyFuel**.
