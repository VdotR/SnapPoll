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
  origin: 'http://localhost:5173'
}));
app.use(session({
  secret: 'secret', //TODO: change
  resave: false,
  saveUninitialized: true,
}));

// Connect to mongodb
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

app.use('/api/poll', pollRoutes);
app.use('/api/user', userRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});