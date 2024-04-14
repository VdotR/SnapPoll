const request = require('supertest');
const { app, server } = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user');

describe('GET /api/user/lookup/sample_user', () => {

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    beforeEach(async () => {
        // Ensure the database is in a known state before each test
        await User.deleteMany({});
    });

    it('responds with json containing sample_user', async () => {
        const newUser = new User({ username: 'sample_user', email: 'sampleuser@ucsd.edu', password: 'sample' });
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
        expect(response.body).toHaveProperty('answered_poll_id');
        expect(Array.isArray(response.body.answered_poll_id)).toBe(true);
    });
});