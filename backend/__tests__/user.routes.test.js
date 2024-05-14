const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, startServer } = require('../routeServer');
const User = require('../models/user');
const Poll = require('../models/poll');
const { createTestUser, createTestPoll } = require('../utils/test');

let agent, newUser;

describe('User Routes', () => {
    let server;
    let mongoServer;

    const loginWith = async (identifier, password, expected_code = 200) => {
        await agent
            .post('/api/user/login')
            .send({
                identifier: identifier,
                password: password
            })
            .expect(expected_code);
    }

    const logout = async (expected_code = 200) => {
        await agent
            .get('/api/user/logout')
            .expect(expected_code);
    }

    const signup = async (email, username, password, expected_code = 201) => {
        await agent
            .post('/api/user/signup')
            .send({
                email: email,
                username: username,
                password: password
            }).expect(expected_code)
    }

    beforeAll(async () => {

        process.env = {
            SMTP_HOST: process.env.SMTP_HOST || "",
            SMTP_USER: process.env.SMTP_USER || "",
            SMTP_PWD: process.env.SMTP_PWD || "",
            BACKEND_BASE_URL: "http://localhost:3000",
            FRONTEND_BASE_URL: "http://localhost:5173"
            // add all necessary mocked env variables here
        };

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
        //Reset cookies before each test
        agent = request.agent(app);
    });
    /*
        it('GET on /lookup/:identifier', async () => {
            newUser = await createTestUser(1);
    
            const response = await request(app)
                .get('/api/user/lookup/sample_user1')
                .expect('Content-Type', /json/)
                .expect(200);
    
            expect(response.body).toHaveProperty('username');
            expect(response.body.username).toBe('sample_user1');
            expect(response.body).toHaveProperty('email');
            expect(response.body.email).toBe('sampleuser1@ucsd.edu');
            expect(response.body).toHaveProperty('created_poll_id');
            expect(Array.isArray(response.body.created_poll_id)).toBe(true);
            expect(response.body.created_poll_id.length).toBe(0);
            expect(response.body).toHaveProperty('answered_poll_id');
            expect(Array.isArray(response.body.answered_poll_id)).toBe(true);
            expect(response.body.answered_poll_id.length).toBe(0);
            expect(response.body).not.toHaveProperty('password');
        });
    */
    it('GET on valid /:id', async () => {
        newUser = await createTestUser(1);

        const response = await request(app)
            .get(`/api/user/${newUser._id}`)
            .expect('Content-Type', /json/)
            .expect(200);


        expect(response.body).toHaveProperty('username');
        expect(response.body.username).toBe('sample_user1');
        expect(response.body).toHaveProperty('email');
        expect(response.body.email).toBe('sampleuser1@ucsd.edu');
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
            .expect(400);
    });

    it('login, auth valid user', async () => {
        newUser = await createTestUser(1);
        await loginWith('sample_user1', 'sample');

        await agent
            .get('/api/user/auth')
            .expect(200)
            .expect(response => {
                expect(response.body).toHaveProperty('isLoggedIn', true);
                expect(response.body).toHaveProperty('userId', newUser._id.toString());
                expect(response.body).toHaveProperty('username', 'sample_user1');
            });

    });

    it('dont login, auth invalid user', async () => {
        await loginWith('sample_user', 'sample', 401);

        await agent
            .get('/api/user/auth')
            .expect(200)
            .expect(response => {
                expect(response.body).toHaveProperty('isLoggedIn', false);
                expect(response.body.userId).toBe(undefined);
                expect(response.body.username).toBe(undefined);
            });
    });

    it('logout no and valid user', async () => {
        newUser = await createTestUser(1);

        await logout(401);

        await loginWith('sample_user1', 'sample');

        await logout();
    });

    it('signup valid user & do not sign up duplicates', async () => {
        await signup('sampleuser@ucsd.edu', 'sample_user', 'sample');

        const validUser = await User.findOne({ email: 'sampleuser@ucsd.edu' }).collation({ locale: 'en', strength: 2 });
        expect(validUser.email).toBe('sampleuser@ucsd.edu');
        expect(validUser.username).toBe('sample_user');
        expect(validUser.password.length).toBe(60);

        await signup('sAmPleuser@ucsd.edu', 'not_sample_user', 'sample', 403);

        expect(await User.countDocuments()).toBe(1);

        await signup('sampleuser@ucsd.edu', 'Sample_user', 'sample', 403);

        expect(await User.countDocuments()).toBe(1);
    });

    it('reject invalid signups', async () => {
        //no @ in email
        await signup('sampleuserucsd.edu', 'sample_user', 'sample', 400);

        expect(await User.countDocuments()).toBe(0);

        //@ in username
        await signup('sAmPleuser@ucsd.edu', '@not_sample_user', 'sample', 400);

        expect(await User.countDocuments()).toBe(0);

        //email too long
        await signup('sampleuser' + "9".repeat(150) + '@ucsd.edu',
            'Sample_user', 'sample', 400);

        expect(await User.countDocuments()).toBe(0);

        //username too long
        await signup('sampleuser@ucsd.edu',
            'Sample_user' + "9".repeat(150), 'sample', 400);

        expect(await User.countDocuments()).toBe(0);

        //password too long
        await signup('sampleuser@ucsd.edu',
            'Sample_user', 'sample' + "9".repeat(75), 400);
        expect(await User.countDocuments()).toBe(0);

        //empty string email
        await signup('', 'sample_user', 'sample', 400);

        expect(await User.countDocuments()).toBe(0);

        //empty string username
        await signup('sampleuser@ucsd.edu', '', 'sample', 400);

        expect(await User.countDocuments()).toBe(0);

        //empty string password
        await signup('sampleuser@ucsd.edu', 'sample_user', '', 400);

        expect(await User.countDocuments()).toBe(0);

        //non-string email
        await signup(1, 'sample_user', 'sample', 400);

        expect(await User.countDocuments()).toBe(0);

        //non-string username
        await signup('sampleuser@ucsd.edu', 1, 'sample', 400);

        expect(await User.countDocuments()).toBe(0);

        //non-string password
        await signup('sampleuser@ucsd.edu', 'sample_user', 1, 400);
        expect(await User.countDocuments()).toBe(0);
    });

    it('valid DELETE on /', async () => {
        newUser = await createTestUser(1);
        expect(await User.countDocuments()).toBe(1);
        await loginWith('sample_user1', 'sample');

        await agent
            .delete('/api/user/')
            .send({ password: 'sample' })
            .expect(200);

        expect(await User.countDocuments()).toBe(0);
    });

    it('invalid DELETE on /', async () => {
        newUser = await createTestUser(1);
        expect(await User.countDocuments()).toBe(1);

        //make sure random delete w/o login doesn't do anything
        await agent
            .delete('/api/user/')
            .send({ password: 'sample' })
            .expect(401);
        expect(await User.countDocuments()).toBe(1);

        await loginWith('sample_user1', 'sample');

        await agent
            .get('/api/user/auth')
            .expect(200)
            .expect(response => {
                expect(response.body).toHaveProperty('isLoggedIn', true);
            });

        //make sure wrong password doesn't do anything
        await agent
            .delete('/api/user/')
            .send({ password: 'samplent' })
            .expect(403);

        expect(await User.countDocuments()).toBe(1);
    });

    it('get on created_polls', async () => {
        [user_1, user_2] = await createTestUser(2);

        const poll_1 = await createTestPoll(user_1, user_2);
        //user_1 poll creator, user_2 poll answerer

        await loginWith('sample_user1', 'sample');

        await agent
            .get(`/api/user/created_polls/${user_1._id}`)
            .expect(200)
            .expect(response => {
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBe(1);
                expect(response.body[0]).toHaveProperty('_id', poll_1._id.toString());
                expect(response.body[0]).toHaveProperty('question', 'Test Poll 1');
                expect(response.body[0]).toHaveProperty('options', ['A', 'B', 'C']);
                expect(response.body[0]).toHaveProperty('correct_option', 0);
                expect(response.body[0]).toHaveProperty('available', true);
                expect(response.body[0]).toHaveProperty('created_by', user_1._id.toString());
                expect(response.body[0].responses.length).toBe(1);
                expect(response.body[0].responses[0]).toHaveProperty('user', user_2._id.toString());
                expect(response.body[0].responses[0]).toHaveProperty('answer', 1);
            });

        await logout();

        //try getting from other user
        await loginWith('sample_user2', 'sample');

        await agent
            .get(`/api/user/created_polls/${user_1._id}`)
            .expect(403);
    });

    it('change_password', async () => {
        newUser = await createTestUser(1);

        await loginWith('sample_user1', 'sample');

        //try incorrect old password
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'samplent', new_password: 'samplenew' })
            .expect(403);

        await logout();

        await loginWith('sample_user1', 'sample');

        //try empty new password
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'sample', new_password: '' })
            .expect(400);

        await logout();

        await loginWith('sample_user1', 'sample');

        //try same new password
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'sample', new_password: 'sample' })
            .expect(405);

        await logout();

        await loginWith('sample_user1', 'sample');

        //try too long new password
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'sample', new_password: 'sample'.repeat(20) })
            .expect(400);

        await logout();

        await loginWith('sample_user1', 'sample');

        //try not string new password
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'sample', new_password: 2 })
            .expect(400);

        await logout();

        await loginWith('sample_user1', 'sample');

        //try valid attempt
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'sample', new_password: 'samplenew' })
            .expect(200);

        await logout();

        //old password shouldn't work
        await loginWith('sample_user1', 'sample', 401);

        await loginWith('sample_user1', 'samplenew');
    });

    it("Check verify api works", async () => {
        newUser = await createTestUser(1);
        newUser.verified = false;
        let newUserId = newUser._id;
        let oldToken = newUser.token;
        await newUser.save();

        let user_unverified = await User.findOne({ _id: newUserId })
        
        // Check if verified updated to false
        expect(user_unverified.verified).toBe(false);

        // verify api call 
        await agent
            .patch(`/api/user/verify/${newUser.token}`)
            .send({ })
            .expect(200);

        // Get user, should be verified
        let user_verified = await User.findOne({ _id: newUserId })

        // Check if user is verified
        expect(user_verified.verified).toBe(true);

        // Check if token has been updated
        expect(oldToken).not.toEqual(user_verified.token);
    });
});
