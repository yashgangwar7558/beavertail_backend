const express = require('express');
const router = express.Router();

const {
    processBill,
} = require('../../controllers/sales/processBill')

const { isAuth } = require('../../middlewares/auth');

const {
    validateBill,
    billValidation
} = require('../../middlewares/validation/bill')

router.post('/process-bill', validateBill, billValidation, processBill);

module.exports = router;