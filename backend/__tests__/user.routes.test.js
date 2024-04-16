const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, startServer } = require('../routeServer');
const User = require('../models/user');
const Poll = require('../models/poll');

let agent;

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
        //Reset cookies before each test
        agent = request.agent(app);
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

    it('login, auth valid user', async () => {
        const newUser = new User({
            username: 'sample_user',
            email: 'sampleuser@ucsd.edu',
            password: 'sample'
        });
        await newUser.save();

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        await agent
            .get('/api/user/auth')
            .expect(200)
            .expect(response => {
                expect(response.body).toHaveProperty('isLoggedIn', true);
                expect(response.body).toHaveProperty('userId', newUser._id.toString());
                expect(response.body).toHaveProperty('username', 'sample_user');
            });

    });

    it('login, auth invalid user', async () => {
        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(400);

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
        await agent
            .get('/api/user/logout')
            .expect(401);

        const newUser = new User({
            username: 'sample_user',
            email: 'sampleuser@ucsd.edu',
            password: 'sample'
        });
        await newUser.save();

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        await agent
            .get('/api/user/logout')
            .expect(200);
    });

    it('signup valid user & do not sign up duplicates', async () => {

        await agent
            .post('/api/user/signup')
            .send({ email: 'sampleuser@ucsd.edu', username: 'sample_user', password: 'sample' })
            .expect(200);

        const validUser = await User.findOne({ email: 'sampleuser@ucsd.edu' }).collation({ locale: 'en', strength: 2 });
        expect(validUser.email).toBe('sampleuser@ucsd.edu');
        expect(validUser.username).toBe('sample_user');
        expect(validUser.password.length).toBe(60);

        await agent
            .post('/api/user/signup')
            .send({ email: 'sAmPleuser@ucsd.edu', username: 'not_sample_user', password: 'sample' })
            .expect(400);
        expect(await User.countDocuments()).toBe(1);

        await agent
            .post('/api/user/signup')
            .send({ email: 'sampleuser@ucsd.edu', username: 'Sample_user', password: 'sample' })
            .expect(400);
        expect(await User.countDocuments()).toBe(1);
    });

    it('reject invalid signups', async () => {

        //no @ in email
        await agent
            .post('/api/user/signup')
            .send({ email: 'sampleuserucsd.edu', username: 'sample_user', password: 'sample' })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);

        //@ in username
        await agent
            .post('/api/user/signup')
            .send({ email: 'sAmPleuser@ucsd.edu', username: '@not_sample_user', password: 'sample' })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);

        //email too long
        await agent
            .post('/api/user/signup')
            .send({
                email: 'sampleuser' + "9".repeat(150) + '@ucsd.edu',
                username: 'Sample_user', password: 'sample'
            })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);

        //username too long
        await agent
            .post('/api/user/signup')
            .send({
                email: 'sampleuser@ucsd.edu',
                username: 'Sample_user' + "9".repeat(150), password: 'sample'
            })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);

        //password too long
        await agent
            .post('/api/user/signup')
            .send({
                email: 'sampleuser@ucsd.edu',
                username: 'Sample_user', password: 'sample' + "9".repeat(75)
            })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);

        //empty string email
        await agent
            .post('/api/user/signup')
            .send({
                email: '',
                username: 'sample_user',
                password: 'sample'
            })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);

        //empty string username
        await agent
            .post('/api/user/signup')
            .send({
                email: 'sampleuser@ucsd.edu',
                username: '',
                password: 'sample'
            })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);

        //empty string password
        await agent
            .post('/api/user/signup')
            .send({
                email: 'sampleuser@ucsd.edu',
                username: 'sample_user',
                password: ''
            })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);

        //non-string email
        await agent
            .post('/api/user/signup')
            .send({
                email: 1,
                username: 'sample_user',
                password: 'sample'
            })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);

        //non-string username
        await agent
            .post('/api/user/signup')
            .send({
                email: 'sampleuser@ucsd.edu',
                username: 1,
                password: 'sample'
            })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);

        //non-string password
        await agent
            .post('/api/user/signup')
            .send({
                email: 'sampleuser@ucsd.edu',
                username: 'sample_user',
                password: 1
            })
            .expect(400);
        expect(await User.countDocuments()).toBe(0);
    });

    it('valid DELETE on /', async () => {
        const newUser = new User({
            username: 'sample_user',
            email: 'sampleuser@ucsd.edu',
            password: 'sample'
        });
        await newUser.save();
        expect(await User.countDocuments()).toBe(1);
        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        await agent
            .delete('/api/user/')
            .send({ password: 'sample' })
            .expect(200);

        expect(await User.countDocuments()).toBe(0);
    });

    it('invalid DELETE on /', async () => {
        const newUser = new User({
            username: 'sample_user',
            email: 'sampleuser@ucsd.edu',
            password: 'sample'
        });
        await newUser.save();
        expect(await User.countDocuments()).toBe(1);

        //make sure random delete w/o login doesn't do anything
        await agent
            .delete('/api/user/')
            .send({ password: 'sample' })
            .expect(401);
        expect(await User.countDocuments()).toBe(1);

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        //make sure wrong password doesn't do anything
        await agent
            .delete('/api/user/')
            .send({ password: 'samplent' })
            .expect(403);

        expect(await User.countDocuments()).toBe(1);
    });

    it('invalid DELETE on /', async () => {
        const newUser = new User({
            username: 'sample_user',
            email: 'sampleuser@ucsd.edu',
            password: 'sample'
        });
        await newUser.save();
        expect(await User.countDocuments()).toBe(1);

        //make sure random delete w/o login doesn't do anything
        await agent
            .delete('/api/user/')
            .send({ password: 'sample' })
            .expect(401);
        expect(await User.countDocuments()).toBe(1);

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        //make sure wrong password doesn't do anything
        await agent
            .delete('/api/user/')
            .send({ password: 'samplent' })
            .expect(403);

        expect(await User.countDocuments()).toBe(1);
    });

    it('get on created_polls', async () => {
        //user with poll to get
        const user_1 = new User({
            username: 'sample_user',
            email: 'sampleuser@ucsd.edu',
            password: 'sample'
        });
        await user_1.save();

        //user who answers poll
        const user_2 = new User({
            username: 'sample_user1',
            email: 'sampleuser1@ucsd.edu',
            password: 'sample'
        });
        await user_2.save();

        const poll_1 = new Poll({
            question: 'question_1',
            options: ['A', 'B'],
            correct_option: 1,
            created_by: user_1._id,
            responses: [{ user: user_2.id, answer: 0 }]
        });
        await poll_1.save();

        await User.updateOne(
            { _id: user_1._id },
            { $addToSet: { created_poll_id: poll_1._id } }
        );
        await User.updateOne(
            { _id: user_2._id },
            { $addToSet: { answered_poll_id: poll_1._id } }
        );

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        await agent
            .get(`/api/user/created_polls/${user_1._id}`)
            .expect(200)
            .expect(response => {
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBe(1);
                expect(response.body[0]).toHaveProperty('_id', poll_1._id.toString());
                expect(response.body[0]).toHaveProperty('question', 'question_1');
                expect(response.body[0]).toHaveProperty('options', ['A', 'B']);
                expect(response.body[0]).toHaveProperty('correct_option', 1);
                expect(response.body[0]).toHaveProperty('available', false);
                expect(response.body[0]).toHaveProperty('created_by', user_1._id.toString());
                expect(response.body[0].responses.length).toBe(1);
                expect(response.body[0].responses[0]).toHaveProperty('user', user_2._id.toString());
                expect(response.body[0].responses[0]).toHaveProperty('answer', 0);
            });

        await agent
            .get('/api/user/logout')
            .expect(200);

        //try getting from other user
        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user1', password: 'sample' })
            .expect(200);

        await agent
            .get(`/api/user/created_polls/${user_1._id}`)
            .expect(403);
    });

    it('change_password', async () => {
        const newUser = new User({
            username: 'sample_user',
            email: 'sampleuser@ucsd.edu',
            password: 'sample'
        });
        await newUser.save();

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        //try incorrect old password
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'samplent', new_password: 'samplenew' })
            .expect(400);

        await agent
            .get('/api/user/logout')
            .expect(200);

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        //try empty new password
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'sample', new_password: '' })
            .expect(400);

        await agent
            .get('/api/user/logout')
            .expect(200);

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        //try same new password
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'sample', new_password: 'sample' })
            .expect(400);

        await agent
            .get('/api/user/logout')
            .expect(200);

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        //try too long new password
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'sample', new_password: 'sample'.repeat(20) })
            .expect(400);

        await agent
            .get('/api/user/logout')
            .expect(200);

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        //try not string new password
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'sample', new_password: 2 })
            .expect(400);

        await agent
            .get('/api/user/logout')
            .expect(200);

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(200);

        //try valid attempt
        await agent
            .patch('/api/user/change_password')
            .send({ old_password: 'sample', new_password: 'samplenew' })
            .expect(200);

        await agent
            .get('/api/user/logout')
            .expect(200);

        //old password shouldn't work
        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'sample' })
            .expect(400);

        await agent
            .post('/api/user/login')
            .send({ identifier: 'sample_user', password: 'samplenew' })
            .expect(200);
    });
});
