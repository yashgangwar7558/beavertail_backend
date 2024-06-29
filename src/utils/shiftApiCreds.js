const axios = require('axios');
require('dotenv').config()
const CryptoJS = require('crypto-js');

const HOST = process.env.HOST
const LOCATION_ID = process.env.LOCATION_ID
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

const timestamp = Math.round(new Date().getTime() / 1000); 
const requestMethod = 'GET';
const requestPath = `/marketplace/v2/brands`;
const requestData = ''; 

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

const url = `${HOST}/marketplace/v2/brands`;

axios.get(url, { headers })
  .then(response => {
    console.log('Response data:', response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
