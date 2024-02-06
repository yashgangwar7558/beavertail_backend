const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
});

module.exports = AWS;

// {
//     "Version": "2012-10-17",
//     "Statement": [
//         {
//             "Effect": "Allow",
//             "Principal": "*",
//             "Action": "s3:GetObject",
//             "Resource": "arn:aws:s3:::beavertail-7558/*"
//         }
//     ]
// }

// [
//     {
//         "AllowedHeaders": [
//             "*"
//         ],
//         "AllowedMethods": [
//             "GET"
//         ],
//         "AllowedOrigins": [
//             "*"
//         ],
//         "ExposeHeaders": [],
//         "MaxAgeSeconds": 3000
//     }
// ]