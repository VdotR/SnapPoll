const nodemailerMock = {
    createTransport: jest.fn().mockReturnThis(),
    sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
};
module.exports = nodemailerMock;