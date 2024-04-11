const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

// Constants
const MAX_POLL_OPTIONS = 6; // Maximum number of options per poll
const NUMBER_OF_POLLS = 3; // Total number of polls to create

try {
    const config = require('./config.json');
    USER_DATA = config.USER_DATA;
  
    if (!USER_DATA || !USER_DATA.email || !USER_DATA.password || !USER_DATA.username) {
      throw new Error("Missing necessary 'USER_DATA' fields.");
    }
  } catch (error) {
    console.error("Error: 'config.json' does not exist or is missing necessary 'USER_DATA' fields. Please ensure the file is correctly set up with 'email', 'password', and 'username'.");
    process.exit(1);
  }
/*
const USER_NUMBER = 22; // User number for non-random user generation

// User details as constants
const USER_DATA = {
    email: `sampleUser${USER_NUMBER}@ucsd.edu`,
    password: `sample`,
    username: `sample_user${USER_NUMBER}`,
};
*/

// Axios instance for reusing throughout requests and retaining cookies
const axiosInstance = wrapper(axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true,
}));

const cookieJar = new CookieJar();
axiosInstance.defaults.jar = cookieJar;

// Function to generate random poll data with variable number of options
const generateRandomPollData = (questionNumber) => {
    const numberOfOptions = Math.floor(Math.random() * MAX_POLL_OPTIONS) + 1; // Ensure at least 1 option
    const options = Array.from({ length: numberOfOptions }, (_, i) => `Option ${i + 1}`);
    let currentDate = new Date();
    let dateString = currentDate.toLocaleDateString();
    let timeString = currentDate.toLocaleTimeString();
    return {
        question: `Seed Poll ${dateString} ${timeString} ${questionNumber}`,
        options: options,
        correct_option: Math.floor(Math.random() * numberOfOptions),
    };
};

// Function to signup a user via POST request
const signupUser = async () => {
    try {
        await axiosInstance.post('/user/signup', USER_DATA);
    } catch (error) {
        console.error('Error signing up user: ', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Function to login a user and store cookies
const loginUser = async () => {
    try {
        await axiosInstance.post('/user/login', {
            identifier: USER_DATA.email,
            password: USER_DATA.password
        });
    } catch (error) {
        console.error('Error logging in user: ', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Function to create a poll via POST request, using authenticated session
const createPoll = async (pollData) => {
    try {
        await axiosInstance.post('/poll', pollData);
    } catch (error) {
        console.error('Error creating poll: ', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Function to logout the user
const logoutUser = async () => {
    try {
        await axiosInstance.get('/user/logout');
    } catch (error) {
        console.error('Error logging out user: ', error.response ? error.response.data : error.message);
    }
};

// Main function to generate and save random polls and users
const seedRandomData = async () => {
    try {
        //await signupUser(); // Signup user
        await loginUser(); // Login user to set cookies for session
        
        for (let i = 0; i < NUMBER_OF_POLLS; i++) {
            const pollData = generateRandomPollData(i);
            await createPoll(pollData); // Create poll with session
        }

        await logoutUser(); // Logout user after operations
        console.log(`${NUMBER_OF_POLLS} polls have been successfully created.`);
    } catch (error) {
        console.error('Error seeding data: ', error);
    }
};

seedRandomData();