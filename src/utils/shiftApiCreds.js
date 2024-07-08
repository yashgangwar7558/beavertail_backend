require('dotenv').config()
const axios = require('axios');
const CryptoJS = require('crypto-js');

const HOST = process.env.HOST
const locationId = process.env.LOCATION_ID
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

const timestamp = Math.round(new Date().getTime() / 1000);
const requestMethod = 'POST';
const requestPath = `/app/s4/install`;
const postData = {
    "event": {
        "name": "marketplace.InstallationRequest.created",
        "component": "marketplace",
        "resource": "InstallationRequest",
        "action": "created",
        "version": "v1",
        "subscriptionId": 1,
        "dispatchedAt": "2019-10-15T17:00:00.000Z"
    },
    "payload": {
        "locationId": 1,
        "guid": "07a3a97e-6154-4e18-97a0-4b59cdd79007"
    }
};

const requestData = Object.keys(postData).length > 0 ? JSON.stringify(postData) : ''

// Generating signature for request authentication
const combinedString = CLIENT_ID + requestMethod + requestPath + requestData + timestamp;
const digest = CryptoJS.HmacSHA256(combinedString, CLIENT_SECRET);
const signature = CryptoJS.enc.Hex.stringify(digest);

const headers = {
    'Content-Type': 'application/json',
    'x-access-key': CLIENT_ID,
    'x-signature': signature,
    'x-timestamp': timestamp
};

const url = `http://localhost:8000/app/s4/install`;

axios.post(url, postData, { headers })
    .then(response => {
        console.log('Response data:', response.data);
    })
    .catch(error => {
        console.error('Error:', error);
    });

