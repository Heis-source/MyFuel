"use strict";

require("dotenv").config();
const mongoose = require("mongoose");

const connect = mongoose.connection;

connect.on("open", () => {
  console.log("Estoy conectado a MongoDB en", connect.name);
});

connect.on("error", (err) => {
  console.error("Error de conexion a MongoDB (Continuando sin BD):", err.message);
  // process.exit(1);
});

mongoose.connect(process.env.MONGODB_CONNECTION);

module.exports = connect;
