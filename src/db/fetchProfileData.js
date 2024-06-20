require('dotenv').config()
const mongoose = require('mongoose');

const CONNECTION_URL = process.env.MONGODB_CONNECTION_URL

async function getProfileData(db, limit) {
    return db.collection('system.profile').find().sort({ ts: -1 }).limit(limit).toArray();
}

async function fetchAndLogProfileData(limit = 10) {
    const connection = await mongoose.connect(CONNECTION_URL, {
        dbName: 'Beavertail',
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    
    const db = mongoose.connection.db;
    const profileData = await getProfileData(db, limit);

    console.log("Most recent profile data:", profileData);
}

fetchAndLogProfileData().catch(console.error)

// db.system.profile.find().sort({ ts: -1 }).limit(10).pretty()