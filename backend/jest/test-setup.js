const { MongoMemoryServer } = require('mongodb-memory-server');

  module.exports = async () => {
    const mongod = await MongoMemoryServer.create();
    global.__MONGOD__ = mongod;
    process.env.CONNECTION_STRING = mongod.getUri();
  };