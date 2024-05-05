// Require user is logged in for a route
function checkSession(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

function checkCreateValidPoll(req, res, next) {
    const MAX_QUESTION_LENGTH = 200;
    const MAX_OPTION_LENGTH = 80;
    const { question, options, correct_option } = req.body;
    
    // Check if question is a string
    if (typeof question !== 'string') {
        return res.status(400).send({ message: 'Question must be a string.' });
    }
    
    // Check if options is an array of strings
    if (!Array.isArray(options) || !options.every(option => typeof option === 'string')) {
        return res.status(400).send({ message: 'Options must be an array of strings.' });
    }
    
    // Check if correct_option is an integer
    if (!Number.isInteger(correct_option)) {
        return res.status(400).send({ message: 'Correct_option must be an integer.' });
    }

    // Check if any of the fields are empty or null
    if (!question || options.length === 0) {
        // If any field is empty or null, send a 400 Bad Request response
        return res.status(400).send({ message: 'Question and options must not be empty.' });
    }

    // Additional validation to ensure options array does not contain empty strings
    if (options.some(option => option.trim() === '')) {
        return res.status(400).send({ message: 'Options must not contain empty strings.' });
    }

    // Separate length validations
    if (question.length > MAX_QUESTION_LENGTH) {
        return res.status(400).send({ message: `Question must be less than ${MAX_QUESTION_LENGTH} characters.` });
    }
    if (options.some(option => option.trim().length > MAX_OPTION_LENGTH)) {
        return res.status(400).send({ message: `Each option must be less than ${MAX_OPTION_LENGTH} characters.` });
    }

    return next();
}

function checkAreAllStrings(req, res, next) {
    for (const key in req.body) {
        if (typeof req.body[key] !== 'string') {
            return res.status(400).send({ message: `All body values must be strings.` });;
        }
    }
    return next();
}

module.exports = {
    checkSession,
    checkCreateValidPoll,
    checkAreAllStrings
}