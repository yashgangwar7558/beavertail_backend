require('dotenv').config();
const mongoose = require('mongoose');

const CONNECTION_URL = process.env.MONGODB_CONNECTION_URL
let dbInstance;

async function enableProfiling(db, level, slowMs) {
    const command = {
        profile: level,
        slowms: slowMs
    };
    return dbInstance.command(command);
}

async function connectToMongoDB() {
    if (!CONNECTION_URL) {
        throw new Error("MONGODB_CONNECTION_URL environment variable is not correctly set.")
    } else {
        try {
            await mongoose.connect(CONNECTION_URL, {
                dbName: 'Beavertail',
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 100, // Adjust based on your application's needs
                minPoolSize: 10, // Maintain a minimum pool of connections
                maxConnecting: 10, // Allow more concurrent connections to speed up initial connection
                maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
                connectTimeoutMS: 10000, // Wait up to 10 seconds for initial connection
                socketTimeoutMS: 60000, // Wait up to 60 seconds for socket operations
                waitQueueTimeoutMS: 5000, // Wait up to 5 seconds for a connection to become available
                serverSelectionTimeoutMS: 5000, // Wait up to 5 seconds for server selection
            });

            dbInstance = mongoose.connection.db;
            // await enableProfiling(db, 1, 100); 

            console.log("Successfully connected to the database!")
        } catch (err) {
            console.error("Connection failed to the database!", err)
            throw err
        }
    }
}

function getDb() {
    if (!dbInstance) {
        throw new Error("Database not initialized. Call connectToMongoDB first.");
    }
    return dbInstance;
}

module.exports = {
    connectToMongoDB,
    getDb
};