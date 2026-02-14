# Contrato de Datos (APIs publicadas)

Fecha: 2026-02-14

Objetivo: que los endpoints devuelvan los mismos campos y tipos en estructuras equivalentes (salvo diferencias obvias como `distance` en resultados cercanos).

## 1) Cargadores EV (DGT DATEX II)

### 1.1 Esquema de un cargador (publicado)

Este es el objeto que se devuelve en:

- `GET /apiv1/chargers` (lista completa)
- `GET /apiv1/nearby` dentro de `results.chargers` (lista limitada y con `distance`)

```json
{
  "id": "string",
  "name": "string",
  "address": "string",
  "postcode": "string",
  "latitude": 40.123,
  "longitude": -3.456,
  "connectors": [
    { "type": "string|null", "power": 50.0 }
  ],
  "lastUpdated": "string"
}
```

Reglas:

- `latitude` y `longitude` siempre son `number` (si vienen inválidos desde DGT se descartan esos registros).
- `power` siempre es `number|null` (kW). Antes se enviaba como string o `"?"`; ahora se normaliza a tipo numérico o `null`.
- `distance` solo existe en `/apiv1/nearby`:

```json
{ "...": "...", "distance": 1.23 }
```

## 2) Gasolineras (MINETUR)

### 2.1 Esquema publicado en `/apiv1/nearby`

Los elementos de `results.fuelStations` son el objeto de MINETUR (con sus claves con acentos) más:

- `lat: number`
- `lon: number`
- `distance: number`

Ejemplo parcial:

```json
{
  "Rótulo": "string",
  "Dirección": "string",
  "Precio Gasolina 95 E5": "string",
  "lat": 43.12,
  "lon": -2.93,
  "distance": 0.45
}
```

## 3) Envoltorios de respuesta (response shape)

### 3.1 `GET /apiv1/chargers`

```json
{ "success": true, "count": 1234, "result": [ /* chargers */ ] }
```

### 3.2 `GET /apiv1/nearby`

```json
{
  "success": true,
  "results": {
    "fuelStations": [ /* fuelStations */ ],
    "chargers": [ /* chargers + distance */ ]
  }
}
```

Nota:

- No se cambia la forma externa del response para no romper consumidores; el cambio principal es **consistencia de tipos** dentro de los objetos (especialmente cargadores).
