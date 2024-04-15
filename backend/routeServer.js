// Imports
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const cors = require('cors');
const defaultPort = process.env.PORT || 3000;
require('dotenv').config();

const pollRoutes = require('./api/routes/poll.routes');
const userRoutes = require('./api/routes/user.routes');

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret', //TODO: change
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 1210000000 // 2 weeks by default or from env
  }
}));

app.use((req, res, next) => {
  setTimeout(next, process.env.RESPONSE_DELAY);
});

app.use('/api/poll', pollRoutes);
app.use('/api/user', userRoutes);

function startServer(mongoUri, port = defaultPort) {
  // Connect to mongodb
  mongoose.connect(mongoUri)
    .catch(err => console.error('Could not connect to MongoDB...', err));

  return new Promise(resolve => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${server.address().port}`);
      resolve(server);
    });
  });
}

module.exports = { app, startServer };