const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, startServer } = require('../routeServer');
const User = require('../models/user');
const Poll = require('../models/poll');
const { password, createTestUser, createTestPoll  } = require('../utils/test');

let agent, creatingUser, answeringUser, newPoll;

describe('Poll Routes', () => {
    let server;
    let mongoServer;

    const loginWith = async (username) => {
        await agent
            .post('/api/user/login')
            .send({ 
                identifier: username,
                password: password
            })
            .expect(200);
    }
 
    const logout = async () => {
        await agent
            .get('/api/user/logout')
            .expect(200);
    }


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
        [creatingUser, answeringUser] = await createTestUser(2);
        newPoll = await createTestPoll(creatingUser, answeringUser);
    });

    it('GET on valid /:id', async () => {
        await loginWith(creatingUser.username);
        await agent
            .get(`/api/poll/${newPoll._id}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(response => {
                expect(response.body).toHaveProperty('_id', newPoll._id.toString());
                expect(response.body).toHaveProperty('question', 'Test Poll 1');
                expect(response.body.options).toEqual(['A', 'B', 'C']);
                expect(response.body).toHaveProperty('correct_option', 0);
                expect(response.body).toHaveProperty('created_by', creatingUser._id.toString());
                expect(response.body.responses.length).toBe(1);
                expect(response.body.responses[0].user).toEqual(answeringUser._id.toString());
                expect(response.body.responses[0].answer).toBe(1);
            });
        await logout();

        await loginWith(answeringUser.username);
        await agent
            .get(`/api/poll/${newPoll._id}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(response => {
                expect(response.body).toHaveProperty('_id', newPoll._id.toString());
                expect(response.body).toHaveProperty('question', 'Test Poll 1');
                expect(response.body.options).toEqual(['A', 'B', 'C']);
                expect(response.body).not.toHaveProperty('correct_option');
                expect(response.body).toHaveProperty('created_by', creatingUser._id.toString());
            });        
    });

    it('GET on nonexisting /:id', async () => {
        await loginWith(creatingUser.username);
        await agent
            .get(`/api/poll/000000000000000000000000`)
            .expect('Content-Type', /json/)
            .expect(404);
   
    });   

    it('GET on invalid /:id', async () => {
        await loginWith(creatingUser.username);
        await agent
            .get(`/api/poll/123`)
            .expect('Content-Type', /json/)
            .expect(400);
    });   

    it('vote on available poll', async () => {
        let foundResponse = false;
        let answerer;

        // creatingUser votes on newPoll
        await loginWith(creatingUser.username)
        await agent
            .patch(`/api/poll/${newPoll._id}/vote`)
            .send({
                answer: 0
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(response => {
                expect(response.body.responses.length).toEqual(2) 
                response.body.responses.forEach(r => {
                    if (r.user == creatingUser._id) {
                        foundResponse = true;
                        expect(r.answer == 0);
                    }
                })
                expect(foundResponse).toEqual(true)
                expect(response.body).toHaveProperty('_id', newPoll._id.toString());
                expect(response.body).toHaveProperty('question', 'Test Poll 1');
                expect(response.body.options).toEqual(['A', 'B', 'C']);
                expect(response.body).toHaveProperty('created_by', creatingUser._id.toString());
            })

        answerer = await User.findById(creatingUser._id)
        expect(answerer.answered_poll_id).toEqual([newPoll._id])
        await logout();

        // Update existing response from answeringUser
        await loginWith(answeringUser.username)
        await agent
            .patch(`/api/poll/${newPoll._id}/vote`)
            .send({
                answer: 2
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(response => {
                expect(response.body.responses.length).toEqual(2) 
                response.body.responses.forEach(r => {
                    if (r.user == creatingUser._id) {
                        expect(r.answer == 0);
                    }
                    if (r.user == answeringUser._id) {
                        foundResponse = true;
                        expect(r.answer == 2);
                    }
                })
                expect(foundResponse).toEqual(true)
                expect(response.body).toHaveProperty('_id', newPoll._id.toString());
                expect(response.body).toHaveProperty('question', 'Test Poll 1');
                expect(response.body.options).toEqual(['A', 'B', 'C']);
                expect(response.body).toHaveProperty('created_by', creatingUser._id.toString());
            })

        answerer = await User.findById(answeringUser._id)
        expect(answerer.answered_poll_id).toEqual([newPoll._id])
    })

    it("vote on unavailable poll", async () => {
        // Cannot vote on unavailable poll
        newPoll.available = false;
        await newPoll.save();
        await loginWith(creatingUser.username)
        await agent
            .patch(`/api/poll/${newPoll._id}/vote`)
            .send({
                answer: 2
            })
            .expect(403)
    });

    it('change poll availability', async () => {
        expect(newPoll.available).toEqual(true);
        await loginWith(creatingUser.username);
        await agent
            .patch(`/api/poll/${newPoll._id}/available`)
            .send({
                available: false
            })
            .expect(200)
            .expect(response => {
                expect(response.body.available == false)
                expect(response.body).toHaveProperty('_id', newPoll._id.toString());
                expect(response.body).toHaveProperty('question', 'Test Poll 1');
                expect(response.body.options).toEqual(['A', 'B', 'C']);
                expect(response.body).toHaveProperty('created_by', creatingUser._id.toString());
                expect(response.body.responses.length).toEqual(1);
            })
        expect(newPoll.available).toEqual(true);

        await agent
            .patch(`/api/poll/${newPoll._id}/available`)
            .send({
                available: true
            })
            .expect(200)
            .expect(response => {
                expect(response.body.available == true)
                expect(response.body).toHaveProperty('_id', newPoll._id.toString());
                expect(response.body).toHaveProperty('question', 'Test Poll 1');
                expect(response.body.options).toEqual(['A', 'B', 'C']);
                expect(response.body).toHaveProperty('created_by', creatingUser._id.toString());
                expect(response.body.responses.length).toEqual(1);
            })
    });

    it('no change to poll availability', async () => {
        expect(newPoll.available).toEqual(true);
        await loginWith(creatingUser.username);
        await agent
            .patch(`/api/poll/${newPoll._id}/available`)
            .send({
                available: true
            })
            .expect(200)
            .expect(response => {
                expect(response.body.available == true)
            })
    });

    it('change poll availability as non-creator', async () => {
        // Cannot change poll availability as answering user
        await loginWith(answeringUser.username);
        await agent
            .patch(`/api/poll/${newPoll._id}/available`)
            .send({
                available: false
            })
            .expect(403)

        newPoll = await Poll.findById(newPoll._id);
        expect(newPoll.available).toEqual(true);
    })

    it('valid POST on /', async () => {
        const body = {
            question: "question?",
            correct_option: 1,
            options: ['A', 'B', 'C']
        }
        await loginWith(creatingUser.username);
        await agent
            .post('/api/poll')
            .send(body)
            .expect(201)
            .expect(response => {
                expect(response.body).toHaveProperty('question', body.question);
                expect(response.body).toHaveProperty('correct_option', body.correct_option);
                expect(response.body).toHaveProperty('options', body.options);
                expect(response.body.available).toEqual(false);
                expect(response.body.responses.length).toEqual(0);
                body._id = response.body._id.toString();
            })
        
        creatingUser = await User.findById(creatingUser._id);
        expect(creatingUser.created_poll_id.length).toEqual(2);
        expect(JSON.stringify(creatingUser.created_poll_id[1])).toEqual(JSON.stringify(body._id));
    });

    it('invalid POST on /', async () => {
        // Cannot create poll with long question
        const body = {
            question: Array(500).fill('a').toString(),
            correct_option: 1,
            options: ['A', 'B', 'C']
        };
        await loginWith(creatingUser.username);
        await agent
            .post('/api/poll')
            .send(body)
            .expect(400)
        
        // Cannot create poll with long option text
        body.question = 'Test'
        body.options = [Array(200).fill('a').toString()]
        await agent
            .post('/api/poll')
            .send(body)
            .expect(400)

        // Cannot create poll with empty question and options
        body.question = ''
        body.options = ['', '']
        await agent
            .post('/api/poll')
            .send(body)
            .expect(400)
    });

    it('valid DELETE on /:id', async () => {
        await loginWith(answeringUser.username);
        await agent
            .patch(`/api/poll/${newPoll._id}/vote`)
            .send({
                answer: 2
            })
            .expect(200)
        await logout();

        await loginWith(creatingUser.username);
        await agent
            .delete(`/api/poll/${newPoll._id}`)
            .expect(200)
        
        creatingUser = await User.findById(creatingUser._id)
        answeringUser = await User.findById(answeringUser._id)
        expect(creatingUser.created_poll_id.length).toEqual(0);
        expect(answeringUser.answered_poll_id.length).toEqual(0);
        
        newPoll = await Poll.findById(newPoll._id)
        expect(newPoll).toEqual(null)
    });

    it('invalid DELETE on /:id', async () => {
        // Non-creating user cannot delete poll
        await loginWith(answeringUser.username);
        await agent
            .delete(`/api/poll/${newPoll._id}`)
            .expect(403)

        // Cannot delete nonexistent poll 
        await agent
            .delete(`/api/polls/ABCDEFG`)
            .expect(404)
    });

    it('valid poll clear', async () => {
        await loginWith(answeringUser.username);
        await agent
            .patch(`/api/poll/${newPoll._id}/vote`)
            .send({
                answer: 2
            })
            .expect(200)
        await logout();

        await loginWith(creatingUser.username);
        await agent
            .patch(`/api/poll/${newPoll._id}/clear`)
            .expect(200)

        newPoll = await Poll.findById(newPoll._id)
        expect(newPoll.responses.length).toEqual(0)
        expect(newPoll.created_by).toEqual(creatingUser._id)

        creatingUser = await User.findById(creatingUser._id)
        answeringUser = await User.findById(answeringUser._id)
        expect(creatingUser.created_poll_id.length).toEqual(1);
        expect(creatingUser.created_poll_id[0]).toEqual(newPoll._id);
        expect(answeringUser.answered_poll_id.length).toEqual(0);
    });
    
    it('invalid poll clear', async () => {
        // Non-creating user cannot clear poll
        await loginWith(answeringUser.username);
        await agent
            .patch(`/api/poll/${newPoll._id}/clear`)
            .expect(403)

        // Cannot clear nonexistent poll
        await agent
            .delete(`/api/polls/ABCDEFG/clear`)
            .expect(404)
    });
});