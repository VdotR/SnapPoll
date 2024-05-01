const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { startServer } = require('../routeServer');
const Poll = require('../models/poll');

describe('Poll Model', () => {
    let server;
    let mongoServer;

    const savePoll = async (question, options, correct_option, created_by) => {
        const poll = new Poll({
            question: question,
            correct_option: correct_option,
            options: options,
            created_by: created_by
        });
        await poll.save();
        return poll;
    };
    
    beforeAll(async () => {
        // Create a new instance of MongoMemoryServer for a clean database
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Start the Express server
        server = await startServer(mongoUri, 3003);
    });
    afterAll(async () => {
        await mongoose.connection.close();
        await mongoServer.stop();
        await server.close();
    });

    beforeEach(async () => {
        // Ensure the database is in a known state before each test
        await Poll.deleteMany({});
    });

    it('saves valid polls', async () => {
        const userId = '6631cb7ff596a04bc0550f7a';

        let poll; 
        poll = await savePoll('non empty string', ['A', 'B'], 1, userId);
        expect(poll).toHaveProperty('question', 'non empty string');
        expect(poll.options).toEqual(['A', 'B']);
        expect(poll).toHaveProperty('correct_option', 1);
        expect(poll.created_by.toString()).toBe(userId);
        expect(poll.responses.length).toBe(0);

        poll = await savePoll('non empty string', [], 1, userId); //empty options
        poll = await savePoll('non empty string', undefined, 1, userId); //options not defined
        expect(poll.options).toStrictEqual([]);  

        poll = await savePoll('non empty string', ['A', 'B'], -1, userId); 
        poll = await savePoll('non empty string', ['A', 'B'], undefined, userId); //correct option not defined
        expect(poll.correct_option).toBe(-1);                
    });
    it(' does not save invalid polls', async () => {
        const userId = '6631cb7ff596a04bc0550f7a';

        await expect(savePoll('', ['A', 'B'], 1, userId)).rejects.toThrow(); //empty question
        await expect(savePoll('non empty string', ['A', 'B'], 1, undefined)).rejects.toThrow(); //no created_by
    });

});