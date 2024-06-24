const { Storage } = require('@google-cloud/storage')
const { VertexAI } = require('@google-cloud/vertexai');

const credentials = {
  "type": "service_account",
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
  "universe_domain": process.env.UNIVERSE_DOMAIN,
}

const formattedPrivateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n')

// Authenticate Google Cloud Storage
const storage = new Storage({
  credentials
})

// Authenticate Vertex AI
const vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: 'us-central1',
  credentials
})

module.exports = {
  storage,
  vertexAI
}