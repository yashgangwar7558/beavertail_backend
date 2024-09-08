const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
    menuExtraction,
    retryExtraction,
    deleteExtraction
} = require('../../controllers/recipe/menuExtraction')

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

router.post('/extract-menu', upload.single('menuFile'), menuExtraction);
router.post('/retry-extraction', retryExtraction);
router.post('/delete-extraction', deleteExtraction);

module.exports = router;