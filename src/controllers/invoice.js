const mongoose = require('mongoose');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const { formatDate } = require('../controllers/helper');

exports.createInvoice = async (userId, invoiceNumber, vendor, invoiceDate, ingredients, payment, status, total, invoiceUrl, session) => {
    try {
        const result = await Invoice.create([{
            userId,
            invoiceNumber,
            vendor,
            invoiceDate,
            ingredients,
            payment,
            status,
            total,
            invoiceUrl,
        }], {session})
        return result
    } catch (err) {
        console.log('Error creating invoice:', err.message);
        throw err
    }
}

exports.updateInvoiceStatus = async (req, res) => {
    try {
        const { userId, invoiceId, newStatus } = req.body;

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            invoiceId,
            { $set: { status: newStatus } },
            { new: true }
        );

        res.json({ success: true, updatedInvoice });
    } catch (error) {
        console.error('Error updating invoice status:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

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

exports.getAllInvoiceBwDates = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found!',
            });
        }

        let query = { userId: user._id };

        if (startDate && endDate) {
            query.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const invoices = await Invoice.find(query);

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

exports.getVendorsTotalBwDates = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body;

        const CstartDate = new Date(startDate)
        const CendDate = new Date(endDate)

        const vendorsTotal = await Invoice.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    invoiceDate: {
                        $gte: new Date(CstartDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
                        $lte: new Date(CendDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
                    },
                },
            },
            {
                $group: {
                    _id: '$vendor',
                    totalAmount: { $sum: { $toDouble: '$total' } }
                }
            },
            {
                $project: {
                    vendor: '$_id',
                    totalAmount: 1,
                    _id: 0
                }
            }
        ]);

        res.json({ success: true, vendorsTotal });
    } catch (error) {
        console.error('Error fetching vendors total:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
