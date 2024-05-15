const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const responseSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answer: { 
        type: Number, 
        required: true,
        validate: {
            validator: function(value) {
                const poll = this.parent();
                return Number.isInteger(value) && value >= 0 && value < poll.options.length;
            },
            message: 'Answer must be a valid index of the options array.'
        }
    },
    updatedAt: { type: Date, default: Date.now, required: true }
});

const MAX_QUESTION_LENGTH = 200;
const MAX_OPTION_LENGTH = 80;

const pollSchema = new Schema({
    question: { 
        type: String, 
        required: [true, 'Question is required.'],
        validate: {
            validator: function(v) {
                return v.length <= MAX_QUESTION_LENGTH;
            },
            message: `Question must be less than ${MAX_QUESTION_LENGTH} characters.`
        }, 
        required: true
    },
    options: {
        type: [String],
        default: [],
        validate: {
            validator: function(arr) {
                return arr.length > 0 && arr.every(option => typeof option === 'string'
                 && option.length > 0 && option.length <= MAX_OPTION_LENGTH);
            },
            message: `Each option must be a non-empty string and less than ${MAX_OPTION_LENGTH} characters.`
        }, 
        required: true
    },
    correct_option: { 
        type: Number, 
        default: -1,
        validate: {
            validator: function(v) {
                return Number.isInteger(v) && (v === -1 || v >= 0 && v < this.options.length);
            },
            message: 'Correct_option must be an integer.'
        },
        required: true
    },
    available: { 
        type: Boolean, 
        default: false, 
        required: true 
    },
    date_created: { 
        type: Date, 
        default: Date.now, 
        required: true 
    },
    created_by: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    responses: { 
        type: [responseSchema], 
        default: [] 
    },
    shortId: { 
        type: String, 
        index: { unique: true, sparse: true }
    }
});

// Pre-save hook to generate shortId
pollSchema.pre('save', async function (next) {
    if (this.available && !this.shortId) {
        try {
            this.shortId = await generateUniqueShortId();
        } catch (error) {
            next(error);
            return;
        }
    } else if (!this.available) {
        this.shortId = undefined;
    }
    next();
});

async function generateUniqueShortId() {
    let id, existing;
    do {
        id = generateShortId();
        existing = await Poll.findOne({ shortId: id }).exec();
    } while (existing); // If the ID exists, loop to generate a new one
    return id;
}

function generateShortId(length = 6) {
    const characters = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charactersLength = characters.length;
    const bytes = crypto.randomBytes(length);
    let id = '';

    for (let i = 0; i < length; i++) {
        id += characters[bytes[i] % charactersLength];
    }

    return id;
}

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;