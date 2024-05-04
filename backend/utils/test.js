const User = require('../models/user')
const Poll = require('../models/poll')
const password = 'sample'

// Returns array of test users or one user
async function createTestUser(count=1) {
    let users = []
    for (let i = 0; i < count; i++) {
        const user = new User({
            username: `sample_user${i+1}`,
            email: `sampleuser${i+1}@ucsd.edu`,
            password: password
        });
        user.verified = true;
        users.push(user);
        await user.save();
    } 
    return count > 1? users : users[0];
}

// Returns array of test polls or one poll
async function createTestPoll(creatingUser, answeringUser=null, count=1) {
    let polls = []
    for (let i = 0; i < count; i++) {
        const poll = new Poll({
            question: `Test Poll ${i+1}`,
            options: ['A', 'B', 'C'],
            correct_option: 0,
            created_by: creatingUser._id,
            available: true,
            responses: answeringUser != null?  [
                {
                    user: answeringUser._id,
                    answer: 1
                }
            ] : []
        })
        polls.push(poll);
        newPoll = await poll.save();
        creatingUser.created_poll_id.push(newPoll._id);
        await creatingUser.save();
        answeringUser.answered_poll_id.push(newPoll._id);
        await answeringUser.save();
    }
    return count > 1? polls : polls[0];
}

module.exports = {
    password,
    createTestUser,
    createTestPoll
}