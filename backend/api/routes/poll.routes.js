// Sends some sample data to mongodb server
const mongoose = require('mongoose');
require('dotenv').config();
const User = require("../../models/user.js");
const Poll = require("../../models/poll.js")
const express = require("express");
const router = express.Router();
const { checkSession } = require('../middleware.js')

// Connect to mongodb
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

//Record a vote from a user. If sucessful, appends _id to  the created_poll_id and answered_poll_id of this user. 
//Also updates the responses of the poll with the request body.
router.patch('/vote/:id', checkSession, async (req, res) => {
    const _id = req.params.id;
    try {
        if (req.session.userId != req.body.user_id) {
            return res.status(401).send("Unauthorized");
        }

        // Check if the poll is available directly
        const poll = await Poll.findById(_id);
        if (!poll) {
            return res.status(400).json({ message: "Poll is not available" });
        } else if (!poll.available) {
            return res.status(400).json({ message: "Poll is not accepting responses" });
        }

        // Update user's answered_poll_id without adding duplicates (like adding to a set)
        await User.updateOne(
            { _id: req.body.user_id },
            { $addToSet: { answered_poll_id: _id } }
        );

        // Check if user already responded
        let existingResponse = poll.responses.find(r => r.user.toString() === req.body.user_id);

        if (existingResponse) {
            // Update the existing response
            existingResponse.answer = req.body.answer;
            existingResponse.updatedAt = Date.now();
        } else {
            // Add new response
            poll.responses.push({
                user: req.body.user_id,
                answer: req.body.answer
            });
        }

        const newPoll = await poll.save();
        res.send(newPoll);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Makes the poll available if requesting user created it.
router.patch('/open/:id', checkSession, async (req, res) => {
    const _id = req.params.id;
    try {
        // Ensure _id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).send("Invalid poll ID.");
        }

        const objectId = new mongoose.Types.ObjectId(_id); // Convert _id to ObjectId for comparison

        const requestingUser = await User.findById(req.session.userId).select('created_poll_id -_id');
        
        // Check if the ObjectId exists in the created_poll_id array
        if (!requestingUser.created_poll_id.some(id => id.equals(objectId))) {
            return res.status(401).send("User did not create this poll.");
        }
        const poll = await Poll.findById(_id);
        poll.available = true;
        const newPoll = await poll.save();
        res.send(newPoll);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
})

//Makes the poll closed to responses if requesting user created it.
router.patch('/close/:id', checkSession, async (req, res) => {
    const _id = req.params.id;
    try {
        // Ensure _id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).send("Invalid poll ID.");
        }

        const objectId = new mongoose.Types.ObjectId(_id); // Convert _id to ObjectId for comparison

        const requestingUser = await User.findById(req.session.userId).select('created_poll_id -_id');
        
        // Check if the ObjectId exists in the created_poll_id array
        if (!requestingUser.created_poll_id.some(id => id.equals(objectId))) {
            return res.status(401).send("User did not create this poll.");
        }
        const poll = await Poll.findById(_id);
        poll.available = false;
        const newPoll = await poll.save();
        res.send(newPoll);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
})

//Create a new poll with user-specified question and options.
//Adds new poll to User created_poll_id
router.post('/', checkSession, async (req, res) => {
    try {
        const poll = new Poll({
            question: req.body.question,
            correct_option: req.body.correct_option,
            options: req.body.options
        });
        await poll.save();
        await User.updateOne(
            { _id: req.session.userId },
            { $addToSet: { created_poll_id: poll._id } }
        );
        res.json(poll);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
})

//Retrieve the post by id 
router.get('/:id', checkSession, async (req, res) => {
    const _id = req.params.id;
    try {
        const poll = await Poll.findById(_id);
        if (!poll) {
            return res.status(404).send({ message: 'Poll not found' });
        }
        else {
            res.send(poll);
        }
    } catch (error) {
        // If there's an error, it might be because the `id` is not a valid ObjectId
        res.status(500).send({ message: error.message });
    }
})

module.exports = router;