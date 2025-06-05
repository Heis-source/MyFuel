const mongoose = require('mongoose');
require('dotenv').config();
const connect = require('../lib/connectMongo');
const Fuel = require('../models/info');

connect.once('open', async () => {
  try {
    const exists = await connect.db.listCollections({ name: 'fuels' }).next();
    if (!exists) {
      await Fuel.createCollection();
      console.log('Collection "fuels" created');
    } else {
      console.log('Collection "fuels" already exists');
    }
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    mongoose.connection.close();
  }
});
