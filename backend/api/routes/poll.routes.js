// Sends some sample data to mongodb server
const mongoose = require('mongoose');
require('dotenv').config();
const User = require("../../models/user.js");
const Poll = require("../../models/poll.js")
const express = require("express");
const router = express.Router();


// Connect to mongodb
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

router.patch('/vote/:id', async (req, res) => {
    const _id = req.params.id;

})

router.patch('/open/:id', async (req, res) => {
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

router.patch('/close/:id', async (req, res) => {
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

router.post('/', async (req, res) => {
    try {
        const poll = new Poll({
            question: req.body.question,
            correct_option: req.body.correct_option,
            options: req.body.options
        });
        await poll.save();
        res.json(poll);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
})

router.get('/:id', async (req, res) => {
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

module.exports = router;