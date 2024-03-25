const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {type: String, required: true},
    password: {type: String, required: true},
    username: {type: String, required: true},
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

const User = mongoose.model('User', userSchema);

module.exports = User;