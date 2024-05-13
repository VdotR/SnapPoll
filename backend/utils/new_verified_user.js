const {generateRandomEmail, generateRandomUsername} = require("./random_info.js");
const User  = require("../models/user.js");
const mongoose = require('mongoose');
require('dotenv').config( {path: require('find-config')('.env')});

const args = process.argv.slice(2)
let username = generateRandomUsername();
let email = generateRandomEmail();
let password = "sample";
if (args.length > 3){
    console.log(`You have ${args.length} arguments and max number of args is 3`)
    console.log(`Example Usage: node new_verified_user.js user email password`)
} else if (args.length == 3){
    username = args[0];
    email = args[1];
    password = args[2];
} else if (args.length == 2){
    username = args[0];
    email = args[1];
} else if (args.length == 1){
    username = args[0];
}

// Connect to mongodb
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

const sampleUser = new User({
    email : email,
    password : password,
    username : username,
    verified : true
});

sampleUser.save();