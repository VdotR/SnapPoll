const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, startServer } = require('../routeServer');
const User = require('../models/user');

describe('User Routes', () => {
    let server;
    let mongoServer;

    beforeAll(async () => {
        // Create a new instance of MongoMemoryServer for a clean database
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // Start the Express server
        server = await startServer(mongoUri, 3002); 
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

    it('GET on /lookup/:identifier', async () => {
        const newUser = new User({
            username: 'sample_user',
            email: 'sampleuser@ucsd.edu',
            password: 'sample'
        });
        await newUser.save();

        const response = await request(app)
            .get('/api/user/lookup/sample_user')
            .expect('Content-Type', /json/)
            .expect(200);


        expect(response.body).toHaveProperty('username');
        expect(response.body.username).toBe('sample_user');
        expect(response.body).toHaveProperty('email');
        expect(response.body.email).toBe('sampleuser@ucsd.edu');
        expect(response.body).toHaveProperty('created_poll_id');
        expect(Array.isArray(response.body.created_poll_id)).toBe(true);
        expect(response.body.created_poll_id.length).toBe(0);
        expect(response.body).toHaveProperty('answered_poll_id');
        expect(Array.isArray(response.body.answered_poll_id)).toBe(true);
        expect(response.body.answered_poll_id.length).toBe(0);
        expect(response.body).not.toHaveProperty('password');
    });

    it('GET on valid /:id', async () => {
        const newUser = new User({
            username: 'sample_user',
            email: 'sampleuser@ucsd.edu',
            password: 'sample'
        });
        await newUser.save();

        const response = await request(app)
            .get(`/api/user/${newUser._id}`)
            .expect('Content-Type', /json/)
            .expect(200);


        expect(response.body).toHaveProperty('username');
        expect(response.body.username).toBe('sample_user');
        expect(response.body).toHaveProperty('email');
        expect(response.body.email).toBe('sampleuser@ucsd.edu');
        expect(response.body).toHaveProperty('created_poll_id');
        expect(Array.isArray(response.body.created_poll_id)).toBe(true);
        expect(response.body.created_poll_id.length).toBe(0);
        expect(response.body).toHaveProperty('answered_poll_id');
        expect(Array.isArray(response.body.answered_poll_id)).toBe(true);
        expect(response.body.answered_poll_id.length).toBe(0);
        expect(response.body).not.toHaveProperty('password');
    });

    it('GET on nonexisting /:id', async () => {
        const response = await request(app)
            .get(`/api/user/000000000000000000000000`)
            .expect(404);
    });

    it('GET on invalid /:id', async () => {
        const response = await request(app)
            .get(`/api/user/123`)
            .expect(500);
    });
});