// Imports
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;
require('dotenv').config();

const pollRoutes = require('./api/routes/poll.routes');

// Middleware
app.use(express.json()); 

// Connect to mongodb
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

app.use('/api/poll', pollRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});