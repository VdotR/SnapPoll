const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validatePassword = function(password) {
    if (process.env.NODE_ENV !== 'production') {
        return true;
    }

    const errors = [];
    if (password.length < 8 || password.length > 70) {
        errors.push('Password must be between 8 and 70 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one symbol.');
    }

    return errors.length === 0 || errors;
};

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
            validator: function(value) {
                const result = validatePassword(value);
                return result === true;
            },
            message: props => validatePassword(props.value)
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
    }],
    verified: { type: Boolean, default: function() {
        return process.env.NODE_ENV !== 'production';
    }},
    token: {type: String, default: () => uuidv4()}
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