// Imports
require('dotenv').config();
const User = require("../../models/user.js");
const express = require("express");
const bcrypt = require('bcrypt');
const router = express.Router();
const { checkSession } = require('../middleware.js')

router.get('/auth/', async (req, res) => {
    return res.json({
        isLoggedIn: !!req.session.userId,
        username: req.session.username
    });
});

router.post('/login/', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const user = await User.findOne({
            $or: [
              { username: { $regex: `^${identifier}$`, $options: 'i' } },
              { email: { $regex: `^${identifier}$`, $options: 'i' } }
            ]
          });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(400).send('Invalid credentials');
        }
        req.session.userId = user._id; // Create a session
        req.session.username = user.username;
        res.send('Login successful');
    } catch (error) {
        res.status(400).send("Invalid request");
    }
});

router.get('/logout/', checkSession, async (req, res) => {
    req.session.destroy(function (err) {
        if (err) {
            // Handle error
            console.error("Session destruction error:", err);
            res.status(500).send("Could not log out.");
        } else {
            // Optionally redirect to login page or send a success response
            res.send("Logged out successfully.");
        }
    });
});

router.get('/lookup/:email_username', async (req, res) => {
    const identifier = req.params.email_username;
    try {
        const existingUser = await User.findOne({
            $or: [
              { username: { $regex: `^${identifier}$`, $options: 'i' } },
              { email: { $regex: `^${identifier}$`, $options: 'i' } }
            ]
          }, { password: 0 });
        if (!existingUser) res.status(404).send("User not found.");
        else res.status(200).send(existingUser);
    }
    catch (error) {
        res.status(500).send("Something went wrong");
    }
});

router.get('/:id', async (req, res) => {
    try {
        const existingUser = await User.findById(req.params.id).select('-password');
        if (!existingUser) res.status(404).send("User not found.");
        else res.send(existingUser);
    }
    catch (error) {
        res.status(500).send("Something went wrong");
    }
});

router.post('/signup/', async (req, res) => {
    try {
        const newUser = new User({
            email: req.body.email.toLowerCase(),
            username: req.body.username.toLowerCase(),
            password: req.body.password 
          });
        await newUser.save();
        res.send("User registration successful.")
    }
    catch (error) {
        if (error.code === 11000) { //Duplicate key error
            if (error.keyPattern.username) {
                console.log('Username already exists.');
                res.status(400).send('Username already exists.');
            } else if (error.keyPattern.email) {
                console.log('Email already exists.');
                res.status(400).send('Email already exists.');
            }
        } else {
            console.error('Error adding user:', error);
            res.status(400).send('Error adding user.');
        }
    }
});

router.delete('/:id', checkSession, async (req, res) => {
    try {
        const deletedUser = await User.findOneAndDelete({ _id: req.params.id });
        if (deletedUser) res.send("Deleted user.");
        else res.status(404).send("User not found.");
    } catch (error) {
        res.status(400).send("Error");
        console.log("Failed" + error);
    }
});

// TODO: should this be here? want to retrieve all polls a user created from newest to oldest
router.get('/created_polls/:identifier', checkSession, async (req, res) => {
    const identifier = req.params.identifier;
    try {
        const existingUser = await User.findOne({ 
            $or: [
                { username: identifier },
                { email: identifier }
            ] 
        }, { password: 0 })
            .populate('created_poll_id');
        if (!existingUser) {
            return res.status(404).send("User not found.");
        }
        if (existingUser.created_poll_id.length == 0) {
            return res.status(400).send("User has not created any polls.");
        }
        if (existingUser._id != req.session.userId) {
            return res.status(401).send("Unauthorized")
        }
        res.send(existingUser.created_poll_id.reverse());
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
})

module.exports = router;