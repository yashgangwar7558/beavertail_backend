const express = require('express');
const router = express.Router();

const {
    getExtractionProcesses,
} = require('../../controllers/recipe/menuExtractionStatus')

router.post('/get-extraction-processes', getExtractionProcesses);

module.exports = router;