const nodemailer = require('nodemailer');
const { sendCustomEmail, sendVerificationEmail } = require('../api/services/email');
const nodemailerMock = require('../__mocks__/nodemailer')

// Mock nodemailer
jest.mock('nodemailer');

describe('Email Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('sendCustomEmail sends an email with correct parameters', async () => {
        const email = 'test@example.com';
        const subject = 'Test Subject';
        const text = 'Test email body';

        await sendCustomEmail(email, subject, text);

        expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith({
            from: process.env.SMTP_USER,
            to: email,
            subject: subject,
            text: text,
        });
    });

    it('sendVerificationEmail sends a verification email with correct parameters', async () => {
        const email = 'test@example.com';
        const token = '123456';

        await sendVerificationEmail(email, token);

        console.log('Mock calls:', nodemailer.createTransport().sendMail.mock.calls);


        expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Verify your email',
            text: `Click the link to verify your email: ${process.env.FRONTEND_BASE_URL}/verify/${token}`,
        });
    });

    it('sendCustomEmail handles errors', async () => {
        const email = 'test@example.com';
        const subject = 'Test Subject';
        const text = 'Test email body';

        nodemailer.createTransport().sendMail.mockRejectedValueOnce(new Error('Failed to send email'));

        await expect(sendCustomEmail(email, subject, text)).rejects.toThrow('Failed to send email');
    });

    test('sendVerificationEmail handles errors', async () => {
        const email = 'test@example.com';
        const token = '123456';

        nodemailer.createTransport().sendMail.mockRejectedValueOnce(new Error('Failed to send email'));

        await expect(sendVerificationEmail(email, token)).rejects.toThrow('Failed to send email');
    });
});