// Imports
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const cors = require('cors');
const port = 3000;
require('dotenv').config();

const pollRoutes = require('./api/routes/poll.routes');
const userRoutes = require('./api/routes/user.routes');

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(session({
  secret: 'secret', //TODO: change
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 1210000000 /*2 weeks*/ } // TODO: Change secure to true when done testing
}));

app.use((req, res, next) => {
  setTimeout(next, process.env.RESPONSE_DELAY);
});

// Connect to mongodb
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

app.use('/api/poll', pollRoutes);
app.use('/api/user', userRoutes);

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = { app, server };