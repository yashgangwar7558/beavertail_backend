const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
    processInvoice,
} = require('../controllers/processInvoice')

const { isAuth } = require('../middlewares/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

router.post('/process-invoice', upload.single('invoiceFile'), processInvoice);

module.exports = router;