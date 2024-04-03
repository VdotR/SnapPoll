const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const responseSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answer: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now, required: true }
});

const pollSchema = new Schema({
    question: { type: String, required: true },
    options: [{ type: String, default: [] }],
    correct_option: { type: Number, default: -1 },
    available: { type: Boolean, default: false },
    date_created: { type: Date, default: Date.now },
    created_by: {type: Schema.Types.ObjectId, ref: "User", required: true},
    responses: { type: [responseSchema], default: [] },
    shortId: { type: String }
});

/*
// Pre-save hook to generate shortId
pollSchema.pre('save', function (next) {
    if (this.isNew) {
        // Generate shortId from ObjectId
        const objectId = this._id.toString().toUpperCase();
        this.shortId = objectId.substring(1, 3) + objectId.substring(9, 11) + objectId.substring(21, 23);
    }
    next();
});
*/ 

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;