const mongoose = require('mongoose');
const User = require('../models/user');
const Recipe = require('../models/recipeBook');
const Ingredient = require('../models/ingredients');
const unitMapping = require('../models/unitmapping');
const Invoice = require('../models/invoice');
const purchaseHistory = require('../models/purchaseHistory');
const {formatDate} = require('../controllers/helper');
const { log } = require('console');

exports.getInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.body;

        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            return res.json({
                success: false,
                message: 'Invoice not found!',
            });
        }

        invoice.uploadDate = formatDate(invoice.uploadDate);
        invoice.invoiceDate = formatDate(invoice.invoiceDate);

        res.json({ success: true, invoice });
    } catch (error) {
        console.error('Error fetching invoice:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getAllInvoice = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found!',
            });
        }

        const invoices = await Invoice.find({ userId: user._id });

        const formattedInvoices = invoices.map((invoice) => {
            return {
                ...invoice._doc,
                uploadDate: formatDate(invoice.uploadDate),
                invoiceDate: formatDate(invoice.invoiceDate)
            };
        });

        res.json({ success: true, invoices: formattedInvoices });
    } catch (error) {
        console.error('Error fetching invoices:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
