const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
    updateInvoiceStatus,
    getInvoice,
    getAllInvoiceBwDates,
    getVendorsTotalBwDates,
    createInvoice,
    updateInvoice,
    deleteInvoice
} = require('../../controllers/invoice/invoice')

const { isAuth } = require('../../middlewares/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

router.post('/create-invoice', upload.single('invoiceFile'), createInvoice);
router.post('/update-invoice', upload.none(), updateInvoice);
router.post('/update-invoice-status', updateInvoiceStatus);
router.post('/delete-invoice', deleteInvoice);
router.post('/get-invoice', getInvoice);
router.post('/get-invoices', getAllInvoiceBwDates);
router.post('/get-vendors-total', getVendorsTotalBwDates);

module.exports = router;