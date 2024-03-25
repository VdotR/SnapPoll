// Imports
require('dotenv').config();
const User = require("../../models/user.js");
const express = require("express");
const router = express.Router();

router.get('/lookup/:email_username', async (req, res) => {
    const identifier = req.params.email_username;
    try{
        const existingUser = await User.findOne({ $or: [{ username : identifier }, { email : identifier}] }, { password: 0 });
        if(!existingUser) res.status(404).send("User not found.");
        else res.status(200).send(existingUser);
    }
    catch (error) {
        res.status(500).send("Something went wrong");
    }
});

router.post('/signup/', async (req, res) => {
    try{
        const newUser = new User({
            email : req.body.email,
            password : req.body.username,
            username : req.body.password,
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

router.post('/login/', async (req, res) => {}); //TODO

router.delete('/:id', async (req, res) => {
    try {
        await User.findOneAndDelete({ _id: req.params.id });
        res.status(200).send("Deleted user.")
    } catch(error) {   
        res.status(400).send("Error");
        console.log("Failed" + error);
    }     
});

module.exports = router;