require('dotenv').config();
const { log } = require('console');
const mongoose = require('mongoose');

const CONNECTION_URL = process.env.MONGODB_CONNECTION_URL;

async function connectToMongoDB() {
    if (!CONNECTION_URL) {
        console.error("Error: MONGODB_CONNECTION_URL environment variable is not set.");
    } else {
        await mongoose.connect(CONNECTION_URL,
            {
                dbName: 'Beavertail',
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        ).then((res) => {
            console.log("Successfully connected to the database");
        }).catch((err) => {
            console.log("Connection failed to the database!!");
        });
    } 
}

module.exports = connectToMongoDB;