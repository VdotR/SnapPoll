const crypto = require('crypto');

// Function to generate a random string of specified length
function generateRandomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') // Convert to hexadecimal format
        .slice(0, length); // Return required number of characters
}

// Function to generate a random email address
function generateRandomEmail() {
    const username = generateRandomString(8); // Generate 8-character username
    const domain = generateRandomString(6) + '.com'; // Generate random domain
    return `${username}@${domain}`;
}

// Function to generate a random username
function generateRandomUsername() {
    return generateRandomString(8); // Generate 8-character username
}

function generateRandomQuestion() {
    return `Question ${generateRandomString(8)}`
}

function generateRandomAnswer(max = 5) {
    return Math.floor(Math.random() * max);
}

module.exports = {
    generateRandomUsername,
    generateRandomEmail,
    generateRandomQuestion,
    generateRandomAnswer
}