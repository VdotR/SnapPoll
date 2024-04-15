const { app, startServer } = require('./routeServer');
require('dotenv').config();

startServer(process.env.CONNECTION_STRING);