// Sends some sample data to mongodb server
const mongoose = require('mongoose');
require('dotenv').config();
const User = require("../models/user.js");
const Poll = require("../models/poll.js")


// Connect to mongodb
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

//Construct sample data
const sampleUser = new User({
    email : "sampleUser2@ucsd.edu",
    password : "sample2",
    username : "sample_user2",
});

const samplePoll = new Poll({
    question : "A sample question????__?",
    options: ['A', 'B', 'C', 'D'],
    correct_option : 2,
    responses : {
        user: sampleUser._id,
        answer : 0
    }
});

sampleUser.save();
samplePoll.save();