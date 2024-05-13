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

module.exports = {
    generateRandomUsername,
    generateRandomEmail
}