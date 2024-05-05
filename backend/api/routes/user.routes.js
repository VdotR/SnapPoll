// Imports
require('dotenv').config( { path: require('find-config')('.env') });
const User = require("../../models/user.js");
const express = require("express");
const bcrypt = require('bcrypt');
const router = express.Router();
const mongoose = require('mongoose');
const { checkSession } = require('../middleware.js')
const { v4: uuidv4 } = require('uuid');
const { sendVerificationEmail } = require('../services/email.js');


//Check if requester is logged in, return id and username
router.get('/auth/', async (req, res) => {
    return res.json({
        isLoggedIn: !!req.session.userId,
        userId: req.session.userId,
        username: req.session.username,
    });
});

//login the user by creating a server side cookie
router.post('/login/', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        let user;

        // Check if the identifier contains '@'
        if (identifier.includes('@')) {
            // Attempt to find the user by email
            user = await User.findOne({ email: identifier }).collation({ locale: 'en', strength: 2 });
        } else {
            // Attempt to find the user by username
            user = await User.findOne({ username: identifier }).collation({ locale: 'en', strength: 2 });
        }

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).send('Invalid credentials');
        }

        if (!user.verified) {
            return res.status(403).send('User not verified. Please check your mailbox for verification email.');
        }
        
        req.session.userId = user._id; // Create a session
        req.session.username = user.username;
        res.send('Login successful');
    } catch (error) {
        res.status(500).send();
        console.error("Error logging in", error.message);
    }
});

// Logout the user by destroying the session
router.get('/logout/', checkSession, async (req, res) => {
    req.session.destroy(function (error) {
        if (error) {
            // Handle error
            console.error("Error logging out:", error.message);
            res.status(500).send("Could not log out.");
        } else {
            // Optionally redirect to login page or send a success response
            res.send("Logged out successfully.");
        }
    });
});
/*
// Returns information (excluding password hash) about the user matching email or username (identifier)
router.get('/lookup/', async (req, res) => {
    const identifier = req.query.identifier; // Use query instead of params
    let query = {};
    console.log('Identifier:', identifier);

    // Check if the identifier contains '@'
    if (identifier && identifier.includes('@')) {
        // Prepare to find the user by email
        query.email = identifier;
    } else {
        // Prepare to find the user by username
        query.username = identifier;
    }

    try {
        const existingUser = await User.findOne(query, { password: 0 }).collation({ locale: 'en', strength: 2 }); // Exclude the password hash from the result
        if (!existingUser) {
            console.log('User not found.');
            res.status(404).send("User not found.");
        } else {
            console.log('User found:', existingUser);
            res.status(200).send(existingUser);
        }
    } catch (error) {
        res.status(500).send("Something went wrong");
    }
});
*/
//Returns information (excluding password hash and auth token) about the user matching id
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ message: 'Invalid ID format' });
        }
        const existingUser = await User.findById(req.params.id).select('-password -token');
        if (!existingUser) res.status(404).send("User not found.");
        else res.send(existingUser);
    }
    catch (error) {
        res.status(500).send();
        console.error("Error finding user by id:", error.message);
    }
});

// Do resend verification email
router.patch('/resend_verification', async (req, res) => {
    // Only email should be enough
    try {
        const { identifier } = req.body;
        let user = null;

        if (identifier.includes('@')) {
            user = await User.findOne({ email: identifier });
        } else {
            user = await User.findOne({ username: identifier });
        }
        if (!user) {
            return res.status(404).send('User not found');
        }


        // Regenerate token
        user.token = uuidv4();
        await user.save();

        await sendVerificationEmail(user.email, user.token);

        res.send("User registration successful.");
    }
    catch (error) {
        res.status(500).send();
        console.error("Error sending verification email", error.message);
    }
});

//Creates new user with given information
//@ char restriciton placed on email/username to prevent case where email and username are the same 
//TODO: Password restrictions (minimum strength) 
router.post('/signup/', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if(typeof email !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).send('Invalid body.');
        }
        // Check if email contains '@'
        if (!email.includes('@')) {
            return res.status(400).send('Email must contain an @ symbol.');
        }

        // Check if username contains '@'
        if (username.includes('@')) {
            return res.status(400).send('Username must not contain an @ symbol.');
        }

        if(typeof password !== 'string') {
            return res.status(400).send('Password must be a string.');
        }
        const newUser = new User({
            email: email,
            username: username,
            password: password
        });

        await newUser.save();

        await sendVerificationEmail(newUser.email, newUser.token);

        res.status(201).send("User registration successful.")
    }
    catch (error) {
        if (error.code === 11000) { //Duplicate key error
            if (error.keyPattern.username) {
                res.status(403).send('Username already exists.');
            } else if (error.keyPattern.email) {
                res.status(403).send('Email already exists.');
            }
        }
        else if (error.name === 'ValidationError') {
            // Handle validation errors for specific fields
            if (error.errors.username) {
                res.status(400).send(error.errors.username.message);
            } else if (error.errors.email) {
                res.status(400).send(error.errors.email.message);
            } else if (error.errors.password) {
                res.status(400).send(error.errors.password.message);
            } else {
                // Handle other validation errors
                console.error('Validation error:', error.message);
                res.status(400).send('Invalid input data.');
            }
        } else {
            console.error('Error signing up user:', error.message);
            res.status(500).send('Error signing up.');
        }
    }
});

//Deletes user if password in body matches, destroys session
router.delete('/', checkSession, async (req, res) => {
    const password = req.body.password;

    try {
        const user = await User.findById(req.session.userId);
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(403).send('Invalid credentials');
        }         
        //TODO: Also delete user responses from polls   
        const deletedUser = await User.findOneAndDelete({ _id: req.session.userId });
        if (deletedUser) {
            req.session.destroy(function (error) {
                if (error) {
                    console.error("Session destruction error:", error.message);
                    res.status(500).send("Error deleting user.");
                }
                else {
                    res.send("Deleted user.");
                }
            });
        }
    } catch (error) {
        res.status(500).send();
        console.error("Error deleting user", error.message);
    }
});

router.get('/created_polls/:id', checkSession, async (req, res) => {
    const id = req.params.id;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ message: 'Invalid ID format' });
        }
        //for now allow only self get
        if(req.session.userId !== id) {
            return res.status(403).send("Forbidden.");
        } 

        const existingUser = await User.findById(id).select('-password')
            .populate('created_poll_id');
        if (!existingUser) {
            return res.status(404).send("User not found.");
        }
        res.send(existingUser.created_poll_id.reverse());
    }
    catch (error) {
        res.status(500).send();
        console.error("Error retrieving user created polls", error.message);
    }
})

// Update user password
router.patch("/change_password", checkSession, async (req, res) => {
    const id = req.session.userId
    try {
        const { old_password, new_password } = req.body;
        // Check whether both are valid
        if (!old_password || !new_password) {
            return res.status(400).send('Invalid request');
        }

        // Compare old password with current password in database
        const user = await User.findById(id);
        if (!await bcrypt.compare(old_password, user.password)) {
            return res.status(403).send('Current Password is invalid!');
        }

        if(old_password === new_password) {
            return res.status(405).send('New password cannot be the same as old password!');
        }

        if(typeof new_password !== 'string') {
            return res.status(400).send('New password must be a string.');
        }

        if(new_password.length > 70) {
            return res.status(400).send('Password must be under 70 characters.');
        }

        // password check passes, now update password
        user.password = new_password;
        await user.save();
        res.send('Password updated successfully');
    } 
    catch (error) {
        res.status(500).send();
        console.error("Error changing password", error.message);
    }
});

router.patch("/verify/:token", async (req, res) => {
    // Retrieve token
    const token = req.params.token;

    try {
        // Find user with token
        const user = await User.findOne({ token });
        // Check whether user exists
        if (!user) {
            return res.status(404).send('User not found');
        }
        // Make user to be verified
        user.verified = true;

        // Generate new token
        user.token = uuidv4();
        await user.save();

        // Confirmation message
        res.send(`User ${user.username} verified`);
    }
    catch (error) {
        res.status(500).send();
        console.error("Error verifying authorization token", error.message);
    }
});

// // Send email - reserved for future use
// router.post('/send_email', async (req, res) => {
//     const { email, subject, text } = req.body;

//     try {
//         await sendCustomEmail(email, subject, text);
//         res.send('Email sent successfully');
//     }
//     catch (error) {
//         res.status(400).send("Invalid request while sending email");
//     }
// });

module.exports = router;