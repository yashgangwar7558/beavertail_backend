const axios = require('axios');
const CryptoJS = require('crypto-js');

const HOST = 'https://conecto-api-sandbox.shift4payments.com'
const LOCATION_ID = '6704'
const CLIENT_ID = 'd801a6ede6134deb978de4f45f4853da';
const CLIENT_SECRET = 'c9436263-8c85-408c-a8f6-401b5256bcae';

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
