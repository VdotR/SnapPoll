const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Use your SMTP server name here,
    port: 587, 
    secure: false, // Use your SMTP server secure here,
    auth: {
      user: "snappolldev@gmail.com", // Your email
      pass: "anfdcpgllgqteyjs" // Your email account password or app-specific password
      //pass: "tdrcalzigkmucgtb" // Your email account password or app-specific password
    }
});

/*
 * Send a custom email using the transporter object
 * Example usage: sendCustomEmail("xxxx@gmail.com", "Test", "Hello World");
 */
const sendCustomEmail = async (email, subject, text) => {
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: process.env.MAILGUN_USERNAME, // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
    });

    console.log("Message sent: %s", info.messageId);
}

sendCustomEmail("victorren2002@gmail.com", "Test", "Hello")