const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { startServer } = require('../routeServer');
const User = require('../models/user');

describe('User Model', () => {
    let server;
    let mongoServer;
    const saveUser = async (email, username, password) => {
        const user = new User({
            email: email,
            username: username,
            password: password
        });
        await user.save();
        return user;
    };
    beforeAll(async () => {
        // Create a new instance of MongoMemoryServer for a clean database
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Start the Express server
        server = await startServer(mongoUri, 3004);
    });
    afterAll(async () => {
        await mongoose.connection.close();
        await mongoServer.stop();
        await server.close();
    });

    beforeEach(async () => {
        // Ensure the database is in a known state before each test
        await User.deleteMany({});
    });

    it('saves valid user and doesnt allow duplicates', async () => {
        let user;
        user = await saveUser('a@bc.de', 'abc', '123');
        expect(user).toHaveProperty('username');
        expect(user.username).toBe('abc');
        expect(user).toHaveProperty('email');
        expect(user.email).toBe('a@bc.de');
        expect(user).toHaveProperty('created_poll_id');
        expect(Array.isArray(user.created_poll_id)).toBe(true);
        expect(user.created_poll_id.length).toBe(0);
        expect(user).toHaveProperty('answered_poll_id');
        expect(Array.isArray(user.answered_poll_id)).toBe(true);
        expect(user.answered_poll_id.length).toBe(0);
        user = await expect(saveUser('a@bc.de', 'abcde', '123')).rejects.toThrow(); //reject same email 
        user = await expect(saveUser('xyz@bc.de', 'abc', '123')).rejects.toThrow(); //reject same username   
        expect(await User.countDocuments()).toBe(1);

    });

    it('doesnt save invalid users', async () => {
        let user;
        user = await expect(saveUser('abc.de', 'abcde', '123')).rejects.toThrow(); //no @ in email 
        user = await expect(saveUser('xyz@bc.de', 'a@bc', '123')).rejects.toThrow(); //@ in username    
        user = await expect(saveUser('', 'a@bc', '123')).rejects.toThrow(); //empty email 
        user = await expect(saveUser('xyz@bc.de', '', '123')).rejects.toThrow(); //empty username  
        user = await expect(saveUser('xyz@bc.de', 'abc', '')).rejects.toThrow(); //empty password 
        user = await expect(saveUser(
            'sampleuser' + "9".repeat(150) + '@ucsd.edu',
            'Sample_user',
            'sample')).rejects.toThrow(); //too long email
        user = await expect(saveUser(
            'sampleuser@ucsd.edu',
            'Sample_user' + "9".repeat(150), 
            'sample')).rejects.toThrow(); //too long username
        user = await expect(saveUser(
            'sampleuser@ucsd.edu',
            'Sample_user', 
            'sample' + "9".repeat(75))).rejects.toThrow(); //too long password
        expect(await User.countDocuments()).toBe(0);
    });
});