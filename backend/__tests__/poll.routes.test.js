const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, startServer } = require('../routeServer');
const User = require('../models/user');
const Poll = require('../models/poll');

let agent;

describe('Poll Routes', () => {
    let server;
    let mongoServer;

    beforeAll(async () => {
        // Create a new instance of MongoMemoryServer for a clean database
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Start the Express server
        server = await startServer(mongoUri, 3001);
    });
    afterAll(async () => {
        await mongoose.connection.close();
        await mongoServer.stop();
        await server.close();
    });

    beforeEach(async () => {
        // Ensure the database is in a known state before each test
        await Poll.deleteMany({});
        await User.deleteMany({});
        agent = request.agent(app);
    });

    it('GET on valid /:id', async () => {
        const creatingUser = new User({
            username: 'sample_user',
            email: 'sampleuser@ucsd.edu',
            password: 'sample'
        });
        await creatingUser.save();

        const answeringUser = new User({
            username: 'sample_user1',
            email: 'sampleuser1@ucsd.edu',
            password: 'sample'
        });
        await answeringUser.save();

        const newPoll = new Poll({
            question: 'question?',
            options: ['A', 'B', 'C'],
            correct_option: 0,
            created_by: creatingUser._id,
            responses: [
                {
                    user: answeringUser._id,
                    answer: 1
                }
            ]
        });
        await newPoll.save();

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        await agent
            .get(`/api/poll/${newPoll._id}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(response => {
                expect(response.body).toHaveProperty('_id', newPoll._id.toString());
                expect(response.body).toHaveProperty('question', 'question?');
                expect(response.body.options).toEqual(['A', 'B', 'C']);
                expect(response.body).toHaveProperty('correct_option', 0);
                expect(response.body).toHaveProperty('created_by', creatingUser._id.toString());
                expect(response.body.responses.length).toBe(1);
                expect(response.body.responses[0].user).toEqual(answeringUser._id.toString());
                expect(response.body.responses[0].answer).toBe(1);
            });

        await agent
            .get('/api/user/logout')
            .expect(200);

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user1', password: 'sample' })
            .expect(200);

            await agent
            .get(`/api/poll/${newPoll._id}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(response => {
                expect(response.body).toHaveProperty('_id', newPoll._id.toString());
                expect(response.body).toHaveProperty('question', 'question?');
                expect(response.body.options).toEqual(['A', 'B', 'C']);
                expect(response.body).not.toHaveProperty('correct_option');
                expect(response.body).toHaveProperty('created_by', creatingUser._id.toString());
            });        
    });


});