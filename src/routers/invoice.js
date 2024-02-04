const express = require('express');
const router = express.Router();

const {
    getInvoice,
    getAllInvoiceBwDates,
    getVendorsTotalBwDates
} = require('../controllers/invoice')

const { isAuth } = require('../middlewares/auth');

router.post('/get-invoice', getInvoice);
router.post('/get-invoices', getAllInvoiceBwDates);
router.post('/get-vendors-total', getVendorsTotalBwDates);

module.exports = router;