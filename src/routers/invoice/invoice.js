const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
    updateInvoiceStatus,
    getInvoice,
    getAllInvoiceBwDates,
    getPerDayInvoicesBwDates,
    getVendorsTotalBwDates,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    extractInvoiceData
} = require('../../controllers/invoice/invoice')

const { isAuth } = require('../../middlewares/auth');

const {
    invoiceValidation,
    validateInvoice,
    parseInvoiceIngredients
  } = require('../../middlewares/validation/invoice')

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

router.post('/create-invoice', upload.single('invoiceFile'), parseInvoiceIngredients, validateInvoice, invoiceValidation, createInvoice);
router.post('/extract-invoice-data', upload.single('invoiceFile'), extractInvoiceData);
router.post('/update-invoice', upload.none(), parseInvoiceIngredients, validateInvoice, invoiceValidation, updateInvoice);
router.post('/update-invoice-status', updateInvoiceStatus);
router.post('/delete-invoice', deleteInvoice);
router.post('/get-invoice', getInvoice);
router.post('/get-invoices', getAllInvoiceBwDates);
router.post('/get-perday-invoices', getPerDayInvoicesBwDates);
router.post('/get-vendors-total', getVendorsTotalBwDates);

module.exports = router;