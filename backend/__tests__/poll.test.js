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
        process.env = {
            SMTP_HOST: process.env.SMTP_HOST || "",
            SMTP_USER: process.env.SMTP_USER || "",
            SMTP_PWD: process.env.SMTP_PWD || "",
            NODE_ENV: 'production',            
            BACKEND_BASE_URL: "http://localhost:3000",
            FRONTEND_BASE_URL: "http://localhost:5173"
            // add all necessary mocked env variables here
        };
        
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
    it('does not save invalid polls', async () => {
        const userId = '6631cb7ff596a04bc0550f7a';

        await expect(savePoll('', ['A', 'B'], 1, userId)).rejects.toThrow(); //empty question
        await expect(savePoll('non empty string', ['A', 'B'], 1, '123')).rejects.toThrow(); //invalid created_by
        await expect(savePoll('non empty string', ['A', 'B'], 1, undefined)).rejects.toThrow(); //no created_by
    });

    it('does save valid responseSchema', async () => {
        const userId = '6631cb7ff596a04bc0550f7a';

        let poll; 
        poll = await savePoll('non empty string', ['A', 'B'], 1, userId);
        poll.responses.push({
            user: userId,
            answer: 1,
            updatedAt: Date.now()
        });
        await poll.save();
    });  

    it('does not save invalid responseSchema', async () => {
        const userId = '6631cb7ff596a04bc0550f7a';

        let poll; 
        poll = await savePoll('non empty string', ['A', 'B'], 1, userId);
        poll.responses.push({
            user: '123', //invalid userId
            answer: 1,
            updatedAt: Date.now()
        });
        await expect(poll.save()).rejects.toThrow();
        poll = await savePoll('non empty string', ['A', 'B'], 1, userId);
        poll.responses.push({
            user: undefined, //no userId
            answer: 1,
            updatedAt: Date.now()
        });
        await expect(poll.save()).rejects.toThrow();    
        
        poll = await savePoll('non empty string', ['A', 'B'], 1, userId);
        poll.responses.push({
            user: userId,
            answer: 'not a number', //invalid answer
            updatedAt: Date.now()
        });
        await expect(poll.save()).rejects.toThrow();        
    });

    it('swapping availability generates shortId, and uniqueness check holds', async () => {
        const userId = '6631cb7ff596a04bc0550f7a';

        let poll_1; 
        poll_1 = await savePoll('non empty string', ['A', 'B'], 1, userId);
        expect(poll_1.available).toBe(false);
        expect(poll_1.shortId).toBe(undefined);        
        poll_1.available = true;
        await poll_1.save();
        expect(poll_1.available).toBe(true);
        expect(poll_1.shortId).not.toBe(undefined);   
        const shortId = poll_1.shortId;
     
        let poll_2;
        poll_2 = await savePoll('non empty string', ['A', 'B'], 1, userId);
        await expect(Poll.findOneAndUpdate({ _id: poll_2._id }, { $set: { shortId: shortId } })).rejects.toThrow();           
    });  
});