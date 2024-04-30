// Imports
require('dotenv').config( { path: require('find-config')('.env') });
const User = require("../../models/user.js");
const express = require("express");
const bcrypt = require('bcrypt');
const router = express.Router();
const { checkSession } = require('../middleware.js')
const { v4: uuidv4 } = require('uuid');
const { sendCustomEmail } = require('../services/email.js');


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
            return res.status(400).send('Invalid credentials');
        }

        if (!user.verified) {
            return res.status(403).send('User not verified. Please check your mailbox for verification email.');
        }
        req.session.userId = user._id; // Create a session
        req.session.username = user.username;
        res.send('Login successful');
    } catch (error) {
        res.status(400).send("Invalid request");
    }
});

// Logout the user by destroying the session
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

// Disabled for now, uncomment if needed
// Returns information (excluding password hash) about the user matching email or username (identifier)
// router.get('/lookup/:identifier', async (req, res) => {
//     const identifier = req.params.identifier;
//     let query = {};

//     // Check if the identifier contains '@'
//     if (identifier.includes('@')) {
//         // Prepare to find the user by email
//         query.email = identifier;
//     } else {
//         // Prepare to find the user by username
//         query.username = identifier;
//     }

//     try {
//         const existingUser = await User.findOne(query, { password: 0 }).collation({ locale: 'en', strength: 2 }); // Exclude the password hash from the result
//         if (!existingUser) {
//             res.status(404).send("User not found.");
//         } else {
//             res.status(200).send(existingUser);
//         }
//     } catch (error) {
//         res.status(500).send("Something went wrong");
//     }
// });

//Returns information (excluding password hash) about the user matching id
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

//Creates new user with given information
//@ char restriciton placed on email/username to prevent case where email and username are the same 
//TODO: Password restrictions (minimum strength) 
router.post('/signup/', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Check if email contains '@'
        if (!email.includes('@')) {
            return res.status(400).send('Email must contain an @ symbol.');
        }

        // Check if username contains '@'
        if (username.includes('@')) {
            return res.status(400).send('Username must not contain an @ symbol.');
        }

        const newUser = new User({
            email: email,
            username: username,
            password: password
        });

        await newUser.save();

        // Send verification email
        const subject = 'Verify your email';
        // Construct the VerifyEmail page
        const text = `Click the link to verify your email: ${process.env.FRONTEND_BASE_URL}/verify/${newUser.token}`;

        await sendCustomEmail(email, subject, text);

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
        }
        else if (error.name === 'ValidationError') {
            // Handle validation errors for specific fields
            if (error.errors.username) {
                console.log('Invalid username:', error.errors.username.message);
                res.status(400).send(error.errors.username.message);
            } else if (error.errors.email) {
                console.log('Invalid email:', error.errors.email.message);
                res.status(400).send(error.errors.email.message);
            } else if (error.errors.password) {
                console.log('Invalid password:', error.errors.password.message);
                res.status(400).send(error.errors.password.message);
            } else {
                // Handle other validation errors
                console.error('Validation error:', error.message);
                res.status(400).send('Invalid input data.');
            }
        } else {
            console.error('Error adding user:', error);
            res.status(400).send('Error adding user.');
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
        const deletedUser = await User.findOneAndDelete({ _id: req.session.userId });
        if (deletedUser) {
            res.send("Deleted user.");
            req.session.destroy(function (err) {
                if (err) {
                    // Handle error
                    console.error("Session destruction error:", err);
                }
            });
        }
    } catch (error) {
        res.status(400).send("Error");
        console.log("Failed" + error);
    }
});

// TODO: should this be here? want to retrieve all polls a user created from newest to oldest
router.get('/created_polls/:id', checkSession, async (req, res) => {
    try {
        const existingUser = await User.findById(req.params.id).select('-password')
            .populate('created_poll_id');
        if (!existingUser) {
            return res.status(404).send("User not found.");
        }
        res.send(existingUser.created_poll_id.reverse());
    }
    catch (error) {
        res.status(500).send({ message: error.message });
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
            return res.status(400).send('Current Password is invalid! Please re-enter!');
        }

        // password check passes, now update password
        user.password = new_password;
        await user.save();
        res.send('Password updated successfully');
    } 
    catch (error) {
        res.status(400).send("Invalid request");
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
        user.token = user.token = () => uuidv4();
        await user.save();

        // Confirmation message
        res.send(`User ${user.username} verified`);
    }
    catch (error) {
        res.status(400).send("Invalid request while verifying token");
    }
});

// Send email
router.post('/send_email', async (req, res) => {
    const { email, subject, text } = req.body;

    try {
        await sendCustomEmail(email, subject, text);
        res.send('Email sent successfully');
    }
    catch (error) {
        res.status(400).send("Invalid request while sending email");
    }
});

module.exports = router;