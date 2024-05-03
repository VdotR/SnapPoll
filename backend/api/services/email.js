const nodemailer = require('nodemailer');
// Some how can't find .env automatically so added find-config package
require('dotenv').config({ path: require('find-config')('.env') });

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, 
    port: 587, 
    secure: false, 
    auth: {
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PWD 
    }
});

/*
 * Send a custom email using the transporter object
 * Example usage: sendCustomEmail("xxxx@gmail.com", "Test", "Hello World");
 */
const sendCustomEmail = async (email, subject, text) => {
    console.log("Sending email to " + email + " with subject " + subject + " and text " + text);
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: process.env.SMTP_USER, // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
    });
}

const sendVerificationEmail = async(email, token) => {
    // Send verification email
    const subject = 'Verify your email';
    // Construct the VerifyEmail page
    const text = `Click the link to verify your email: ${process.env.FRONTEND_BASE_URL}/verify/${token}`;

    await sendCustomEmail(email, subject, text);
}


module.exports = { sendCustomEmail, sendVerificationEmail };