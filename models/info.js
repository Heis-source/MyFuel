'use strict';

const mongoose = require('mongoose');

const FuelSchema = mongoose.Schema({
    Fecha: Date,
    Dirección: String,
    Horario: String,
    Latitud: String,
    "Longitud (WGS84)": String,
    Municipio: String,
    'Precio Biodiesel': String,
    'Precio Bioetanol': String,
    'Precio Gas Natural Comprimido': String,
    'Precio Gas Natural Licuado': String,
    'Precio Gases licuados del petróleo': String,
    'Precio Gasoleo A': String,
    'Precio Gasoleo B': String,
    'Precio Gasoleo Premium': String,
    'Precio Gasolina 95 E10': String,
    'Precio Gasolina 95 E5': String,
    'Precio Gasolina 95 E5 Premium': String,
    'Precio Gasolina 98 E10': String,
    'Precio Gasolina 98 E5': String,
    'Precio Hidrogeno': String,
    Provincia: String,
    Rotulo: String,
});

const Fuel = mongoose.model('Fuel', FuelSchema);

module.exports = Fuel;