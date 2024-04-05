// Sends some sample data to mongodb server
const mongoose = require('mongoose');
require('dotenv').config();
const User = require("../../models/user.js");
const Poll = require("../../models/poll.js")
const express = require("express");
const router = express.Router();
const { checkSession, checkCreateValidPoll } = require('../middleware.js')

// Connect to mongodb
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

//Record a vote from a user. If sucessful, appends _id to  the created_poll_id and answered_poll_id of this user. 
//Also updates the responses of the poll with the request body.
router.patch('/:id/vote', checkSession, async (req, res) => {
    const _id = req.params.id;
    try {
        // Check if the poll is available directly
        const poll = await Poll.findById(_id);
        if (!poll) {
            return res.status(400).json({ message: "Poll is not available" });
        } else if (!poll.available) {
            return res.status(400).json({ message: "Poll is not accepting responses" });
        }

        // Update user's answered_poll_id without adding duplicates (like adding to a set)
        await User.updateOne(
            { _id: req.session.userId },
            { $addToSet: { answered_poll_id: _id } }
        );

        // Check if user already responded
        let existingResponse = poll.responses.find(r => r.user.toString() === req.session.userId);

        if (existingResponse) {
            // Update the existing response
            existingResponse.answer = req.body.answer;
            existingResponse.updatedAt = Date.now();
        } else {
            // Add new response
            poll.responses.push({
                user: req.session.userId,
                answer: req.body.answer,
                updatedAt: Date.now()
            });
        }

        const newPoll = await poll.save();
        res.send(newPoll);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Changes poll availability if requesting user created it.
router.patch('/:id/available', checkSession, async (req, res) => {
    const _id = req.params.id;
    const { available } = req.body;

    if (typeof available !== 'boolean') {
        return res.status(400).send({ message: "'available' must be true or false." });
    }    

    try {
        const poll = await Poll.findById(_id);
        if (req.session.userId !== poll.created_by.toString()) {
            return res.status(403).send("Forbidden");
        }
        // Update the poll's availability only if it's different
        if (poll.available !== available) {
            poll.available = available;
            const updatedPoll = await poll.save();
            res.send(updatedPoll);
        } else {
            // Do nothing if the current state matches the requested state
            res.send({ message: "No changes made, poll availability is already set to " + available });
        }
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
})

//Create a new poll with user-specified question and options.
//Adds new poll to User created_poll_id
// Constants

router.post('/', checkSession, checkCreateValidPoll, async (req, res) => {
    // Destructure the required fields from req.body
    const { question, correct_option, options } = req.body;

    try {
        const poll = new Poll({
            question: question,
            correct_option: correct_option,
            options: options,
            created_by: req.session.userId
        });

        const newPoll = await poll.save();

        // Update user's created_poll_id
        await User.updateOne(
            { _id: req.session.userId },
            { $push: { created_poll_id: newPoll._id } }
        );

        res.json(newPoll);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.post('/quickpoll', checkSession, checkCreateValidPoll, async (req, res) => {
    // Get current date
    let currentDate = new Date();
    let dateString = currentDate.toLocaleDateString();
    let timeString = currentDate.toLocaleTimeString();

    // Create a question string based on current date and time
    const question = `Quick Poll ${dateString} ${timeString}`;
    const correct_option = -1;
    const options = ["A", "B", "C", "D", "E"];

    try {
        const poll = new Poll({
            question: question,
            correct_option: correct_option,
            options: options,
            created_by: req.session.userId
        });

        const newPoll = await poll.save();

        // Update user's created_poll_id
        await User.updateOne(
            { _id: req.session.userId },
            { $push: { created_poll_id: newPoll._id } }
        );

        res.json(newPoll);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});

//Retrieve the poll by id 
//Removes correct answer, responses in response if not poll creator
router.get('/:id', checkSession, async (req, res) => {
    const _id = req.params.id;
    try {
        let poll = await Poll.findById(_id);
        if (!poll) {
            return res.status(404).send({ message: 'Poll not found' });
        }

        // Convert to a JavaScript object to allow modifications
        poll = poll.toObject();

        // Conditionally modify the poll object based on who is requesting
        if (req.session.userId !== poll.created_by.toString()) {
            // If the user is not the creator of the poll, delete the correct answer and filter the responses
            delete poll.correct_answer;
            poll.responses = poll.responses.filter(response => response.user.toString() === req.session.userId);
        }

        res.send(poll);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

//Delete the poll if user is creator
router.delete('/:id', checkSession, async (req, res) => {
    try {
        const _id = req.params.id;
        const poll = await Poll.findById(_id).select('created_by');
        if (!poll) {
            return res.status(404).send({ message: "Can't delete poll: Poll not found" });
        }
        if (req.session.userId !== poll.created_by.toString()) {
            return res.status(403).send({ message: "Can't delete poll: Unauthorized" });
        }

        // Poll Side
        await Poll.findOneAndDelete({ _id: _id })


        // User side 
        // Each poll is created by ONLY 1 user
        const updateCreated = User.findOneAndUpdate(
            { created_poll_id: _id },
            { $pull: { created_poll_id: _id } }
        );

        // Each poll will be answered by multiple users
        const updateAnswered = User.updateMany(
            { answered_poll_id: _id },
            { $pull: { answered_poll_id: _id } }
        );

        await Promise.all([updateCreated, updateAnswered]);

        res.send({ message: "Poll and references deleted successfully.", poll });

    } catch (error) {
        // If there's an error, it might be because the `id` is not a valid ObjectId
        res.status(500).send({ message: error.message });
    }
})

router.patch('/:id/clear', checkSession, async (req, res) => {
    try {
        const _id = req.params.id;
        const poll = await Poll.findById(_id).select('created_by');
        if (!poll) {
            return res.status(404).send({ message: "Can't clear poll: Poll not found" });
        }
        if (req.session.userId !== poll.created_by.toString()) {
            return res.status(403).send({ message: "Can't clear poll: Unauthorized" });
        }
        const result = await Poll.updateOne(
            { _id: _id },
            { $set: { responses: [] } }
        );

        // Update User side 
        await User.updateMany(
            { answered_poll_id: _id },
            { $pull: { answered_poll_id: _id } }
        );

        if (result.modifiedCount === 0) {
            return res.status(200).send({ message: 'No updates made to the poll. The poll may be originally empty' });
        }

        res.send({ message: 'Poll responses cleared successfully' });

    } catch (error) {
        console.error('Error clearing poll responses:', error);
        // If there's an error, it might be because the `id` is not a valid ObjectId
        res.status(500).send({ message: error.message });
    }
})

module.exports = router;