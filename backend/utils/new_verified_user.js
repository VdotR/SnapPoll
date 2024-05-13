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

const createVerifiedUser = (username, email, password) => {
    // Connect to MongoDB
    mongoose.connect(process.env.CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log('Connected to MongoDB');

        const sampleUser = new User({
            email: email,
            password: password,
            username: username,
            verified: true
        });

        // Save the sample user and handle the promise
        sampleUser.save().then(() => {
            console.log('User successfully added.');
            mongoose.disconnect().then(() => {
                console.log('MongoDB connection closed.');
                console.log('Created verified user');
                console.log(`Username: ${sampleUser.username}`);
                console.log(`email: ${sampleUser.email}`);
                console.log(`password: ${password}`);
                process.exit(0); // Exit the process after the connection is closed
            });
        }).catch(err => {
            console.error('Error saving user:', err);
            mongoose.disconnect().then(() => {
                console.log('MongoDB connection closed.');
                process.exit(1); // Exit the process with an error code
            });
        });

    }).catch(err => {
        console.error('Could not connect to MongoDB...', err);
        process.exit(1); // Exit the process with an error code
    });
}

createVerifiedUser(username, email, password);

module.exports = createVerifiedUser;

