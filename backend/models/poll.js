const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const response_schema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: "User"},
    answer: Number
});

const pollSchema = new Schema({
    question: {type: String, required: true},
    options:  [{type: String, default: []}],
    correct_option: {type: Number, default: -1},
    date_created: { type: Date, default: Date.now },
    responses: {type: [response_schema], default: []}
});

const Poll = mongoose.model('Poll', pollSchema);