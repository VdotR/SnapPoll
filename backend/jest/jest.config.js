module.exports = {
    verbose: true,  // Display detailed information about each test
    testEnvironment: 'node',  // Specify the environment in which tests are run
    collectCoverage: false,  // Enable test coverage information
    coverageDirectory: 'coverage',  // Specify the directory where Jest should output coverage files
    testPathIgnorePatterns: ['/node_modules/'],  // Specify paths to ignore during testing
    testMatch: ["**/__tests__/**/*.js"],
    globalSetup: "./jest/test-setup.js",
    globalTeardown: "./jest/test-teardown.js",
    rootDir: "../"
};