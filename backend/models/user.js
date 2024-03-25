const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    username: {type: String, required: true, unique: true},
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
userSchema.pre('save', async function(next) {
    // Check if the password is modified or if it's a new user
    if (this.isModified('password') || this.isNew) {
        const salt = await bcrypt.genSalt(10); // Generate a salt
        this.password = await bcrypt.hash(this.password, salt); // Hash the password with the salt
    }
    next(); // Proceed to the next middleware or save the document
});

const User = mongoose.model('User', userSchema);

module.exports = User;