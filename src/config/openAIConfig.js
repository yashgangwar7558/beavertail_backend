const { Configuration, OpenAI } = require('openai');

const configuration = {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG,
    project: process.env.OPENAI_PROJECT
};

const openai = new OpenAI(configuration);

module.exports = openai