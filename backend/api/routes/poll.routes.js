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

router.patch('/vote/:id', checkSession, async (req, res) => {
    const _id = req.params.id;
    try {
        // Check if the poll is available directly
        const poll = await Poll.findById(_id);
        if (!poll) {
            return res.status(400).json({ message: "Poll is not available" });
        } else if (!poll.available){
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
                answer: req.body.answer
            });
        }
        
        const newPoll = await poll.save();
        res.send(newPoll);
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/open/:id', checkSession, async (req, res) => {
    const _id = req.params.id;
    try {
        const poll = await Poll.findById(_id);
        poll.available = true;
        const newPoll = await poll.save();
        res.send(newPoll);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
})

router.patch('/close/:id', checkSession, async (req, res) => {
    const _id = req.params.id;
    try {
        const poll = await Poll.findById(_id);
        poll.available = false;
        const newPoll = await poll.save();
        res.send(newPoll);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
})

router.post('/', checkSession, async (req, res) => {
    try {
        const poll = new Poll({
            question: req.body.question,
            correct_option: req.body.correct_option,
            options: req.body.options
        });
        const newPoll = await poll.save();

        // Update user's created_poll_id
        await User.updateOne(
            { _id: req.session.userId},
            { $push: { created_poll_id: newPoll._id } }
        );

        res.json(newPoll);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
})

router.get('/:id', checkSession, async (req, res) => {
    const _id = req.params.id;
    try{
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


router.delete('/:id', checkSession, async (req, res) => {
    try{
        const _id = req.params.id;
        // Poll Side
        const poll = await Poll.findOneAndDelete({ _id: _id })
        if (!poll) {
            return res.status(404).send({ message: "Can't delete poll: Poll not found" });
        }

        // User side 
        // Each poll is created by ONLY 1 user
        const updateCreated = User.findOneAndUpdate(
            { created_poll_id: _id },
            { $pull: { created_poll_id : _id } }
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
    try{
        const _id = req.params.id;
        const result = await Poll.updateOne(
            { _id : _id },
            { $set : {responses: []}}
        );

        // Check if the poll was found and updated
        if (result.matchedCount === 0) {
            return res.status(404).send({ message: 'Poll not found' });
        }
      
        // Update User side 
        await User.updateMany(
            { answered_poll_id: _id }, 
            { $pull: { answered_poll_id: _id } } 
        );

        if (result.modifiedCount === 0) {
            return res.status(200).send({ message: 'No updates made to the poll. The poll maybe originally empty' });
        }

      res.send({ message: 'Poll responses cleared successfully' });

    } catch (error) {
        console.error('Error clearing poll responses:', error);
        // If there's an error, it might be because the `id` is not a valid ObjectId
        res.status(500).send({ message: error.message });
    }
})

module.exports = router;