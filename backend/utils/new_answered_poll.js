// Imports
require('dotenv').config({ path: require('find-config')('.env') });
const { generateRandomEmail, generateRandomUsername, generateRandomQuestion, generateRandomAnswer } = require("./random_info.js");
const User = require("../models/user.js");
const Poll = require("../models/poll.js");
const mongoose = require('mongoose');

const createAnsweredPolls = (pollNum = 25) => {
    // Connect to MongoDB
    mongoose.connect(process.env.CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log('Connected to MongoDB');
        const poll_creater = new User({
            email: generateRandomEmail(),
            password: "sample",
            username: generateRandomUsername(),
            verified: true
        });

        const poll_responder = new User({
            email: generateRandomEmail(),
            password: "sample",
            username: generateRandomUsername(),
            verified: true
        });

        let created_polls = [];
        for (let i = 0; i < pollNum; i++) {
            const samplePoll = new Poll({
                question: generateRandomQuestion(),
                options: ['A', 'B', 'C', 'D', 'E'],
                correct_option: generateRandomAnswer(),
                responses: {
                    user: poll_responder._id,
                    answer: generateRandomAnswer()
                },
                created_by: poll_creater._id,
                available: true
            });
            created_polls.push(samplePoll);

            // Add poll to creator
            poll_creater.created_poll_id.push(samplePoll._id);

            // Add poll to responder
            poll_responder.answered_poll_id.push(samplePoll._id);
        }

        // Save creator and responder
        return Promise.all([poll_creater.save(), poll_responder.save()])
            .then(() => {
                // Save all polls
                return Promise.all(created_polls.map(poll => poll.save()));
            })
            .then(() => {
                console.log('All data saved successfully');
                console.log(`Poll Creater Username: ${poll_creater.username}`);
                console.log(`Poll responder Username: ${poll_responder.username}`);
                console.log("Password is **sample** for all users")
                // Disconnect from MongoDB
                return mongoose.disconnect();
            })
            .catch(err => {
                console.error('Error during database operations:', err);
                // Attempt to disconnect even in case of error
                mongoose.disconnect();
            });
    }).catch(err => {
        console.error('Could not connect to MongoDB...', err);
        mongoose.disconnect();
    });
}

createAnsweredPolls();