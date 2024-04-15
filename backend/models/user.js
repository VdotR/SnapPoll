const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        index: { unique: true, collation: { locale: 'en', strength: 2 } },
        validate: {
            validator: function (email) {
                return emailRegex.test(email) && email.length < 150; //allows most but not all emails, doesn't allow case sensitivity in local 
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String, required: true,
        validate: {
            validator: function (password) {
                return password.length < 70;
            },
            message: props => `Password ${props.value} is invalid. It must be lower than 70 characters.`
        }
    },
    username: {
        type: String,
        required: true,
        index: { unique: true, collation: { locale: 'en', strength: 2 } },
        validate: {
            validator: function (username) {
                // Check that username does not contain '@'
                return username.length < 150 && !username.includes('@');
            },
            message: props => `Username ${props.value} is invalid. '@' is not allowed and it must be below 150 characters.`
        }
    },
    date_joined: { type: Date, default: Date.now },
    created_poll_id: [{
        type: Schema.Types.ObjectId,
        default: [],
        ref: "Poll"
    }],
    answered_poll_id: [{
        type: Schema.Types.ObjectId,
        default: [],
        ref: "Poll"
    }]
});

// Password encryption middleware
userSchema.pre('save', async function (next) {
    // Check if the password is modified or if it's a new user
    if (this.isModified('password') || this.isNew) {
        const salt = await bcrypt.genSalt(10); // Generate a salt
        this.password = await bcrypt.hash(this.password, salt); // Hash the password with the salt
    }

    next(); // Proceed to the next middleware or save the document
});

const User = mongoose.model('User', userSchema);

module.exports = User;