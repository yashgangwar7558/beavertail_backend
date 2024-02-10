const express = require('express');
const router = express.Router();

const {
    updateInvoiceStatus,
    getInvoice,
    getAllInvoiceBwDates,
    getVendorsTotalBwDates,
} = require('../controllers/invoice')

const { isAuth } = require('../middlewares/auth');

router.post('/update-invoice-status', updateInvoiceStatus);
router.post('/get-invoice', getInvoice);
router.post('/get-invoices', getAllInvoiceBwDates);
router.post('/get-vendors-total', getVendorsTotalBwDates);

module.exports = router;