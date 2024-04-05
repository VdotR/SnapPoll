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
    const { question, correct_option, options } = req.body;
    // Check if any of the fields are empty or null
    if (!question || correct_option === null || !Array.isArray(options) || options.length === 0) {
        // If any field is empty or null, send a 400 Bad Request response
        return res.status(400).send({ message: 'Question, correct option, and options must not be empty.' });
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

module.exports = {
    checkSession,
    checkCreateValidPoll
}