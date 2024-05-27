const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Tenant = require('../../models/tenant/tenant');
const Invoice = require('../../models/invoice/invoice');
const { formatDate, uploadToGCS, deleteFromGCS } = require('../helper');
const { checkIngredientsThreshold } = require('../ingredient/ingredients')
const { log } = require('console');

exports.createInvoice = async (req, res) => {
    try {
        const { tenantId, invoiceNumber, vendor, invoiceDate, ingredients, payment, statusType, total } = req.body;

        if (req.file) {
            const { buffer } = req.file;
            const fileName = `${invoiceNumber}_${Date.now()}`;
            const fileType = req.file.mimetype;
            const bucketName = process.env.BUCKET_NAME;
            const folderPath = 'invoices';
            const invoiceUrl = await uploadToGCS(buffer, fileName, fileType, bucketName, folderPath);
            // const invoiceUrl = 'https://www.google.com/';

            if (!invoiceUrl) {
                throw new Error('Error uploading file to S3');
            }

            const existingInvoice = await Invoice.findOne({ invoiceNumber, tenantId });

            if (existingInvoice &&
                existingInvoice.status.type !== 'Approval-Rejected' &&
                existingInvoice.status.type !== 'Review-Rejected') {
                return res.json({
                    success: false,
                    message: 'Invoice already exists! You can\'t upload the same invoice until it\'s Rejected.',
                });
            }

            const invoice = await Invoice.create([{
                tenantId,
                invoiceNumber,
                vendor,
                invoiceDate,
                ingredients,
                payment,
                status: {
                    type: statusType || 'Pending Review',
                    remark: ''
                },
                total,
                invoiceUrl,
            }])
            res.json({ success: true, invoice })
            await checkIngredientsThreshold(tenantId, ingredients, vendor, invoice[0]._id);
        } else {
            return res.json({
                success: false,
                message: 'Invoice file missing!',
            });
        }
    } catch (error) {
        console.error('Error creating invoice:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.extractInvoiceData = async (req, res) => {
    try {
        if (req.file) {
            extractedData = {
                invoiceNumber: '133400406',
                vendor: 'Gordon Food Service',
                invoiceDate: '2012-06-20',
                ingredients: [
                    {
                        name: 'Cottage cheese',
                        quantity: 2,
                        unit: 'piece',
                        unitPrice: '26.98',
                        total: '53.96'
                    },
                    {
                        name: 'Peeled Garlic',
                        quantity: 1,
                        unit: 'piece',
                        unitPrice: '9.01',
                        total: '9.01'
                    },
                    {
                        name: 'KE SLCD BCN',
                        quantity: 2,
                        unit: 'piece',
                        unitPrice: '34.85',
                        total: '69.70'
                    },
                    {
                        name: 'Curly Lasagna',
                        quantity: 1,
                        unit: 'piece',
                        unitPrice: '12.43',
                        total: '12.43'
                    },
                    {
                        name: 'Jalapeno Peppers',
                        quantity: 1,
                        unit: 'piece',
                        unitPrice: '23.87',
                        total: '23.87'
                    },
                    {
                        name: 'Red Pepper',
                        quantity: 1,
                        unit: 'piece',
                        unitPrice: '27.48',
                        total: '27.48'
                    },
                    {
                        name: 'Shell Taco',
                        quantity: 2,
                        unit: 'piece',
                        unitPrice: '10.62',
                        total: '21.24'
                    },
                    {
                        name: 'Bacon Crumbles',
                        quantity: 1,
                        unit: 'piece',
                        unitPrice: '64.40',
                        total: '64.40'
                    },
                    {
                        name: 'Triumph 1# PPR',
                        quantity: 2,
                        unit: 'piece',
                        unitPrice: '31.90',
                        total: '63.80'
                    },
                    {
                        name: 'Triumph 1# PPR',
                        quantity: 2,
                        unit: 'piece',
                        unitPrice: '31.40',
                        total: '62.80'
                    },
                ],
                payment: 'Net Banking',
                total: '406.69'
            }

            res.json({ success: true, extractedData })

        } else {
            return res.json({
                success: false,
                message: 'Invoice file missing!',
            });
        }
    } catch (error) {
        console.error('Error extracting data from invoice:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.updateInvoice = async (req, res) => {
    try {
        const { invoiceId, tenantId, invoiceNumber, vendor, invoiceDate, ingredients, payment, statusType, total } = req.body

        const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, {
            invoiceNumber,
            vendor,
            invoiceDate,
            ingredients,
            payment,
            status: {
                type: statusType || 'Pending Review',
                remark: ''
            },
            total
        }, {
            new: true
        });

        res.json({ success: true, updatedInvoice });
        await checkIngredientsThreshold(tenantId, ingredients, vendor, updatedInvoice._id)
    } catch (error) {
        console.error('Error updating invoice:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.updateInvoiceStatus = async (req, res) => {
    try {
        const { tenantId, invoiceId, newStatus, newRemark } = req.body;

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            invoiceId,
            { $set: { status: { type: newStatus, remark: newRemark } } },
            { new: true }
        );

        res.json({ success: true, updatedInvoice });
    } catch (error) {
        console.error('Error updating invoice status:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.deleteInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.body

        if (!invoiceId) {
            return res.json({
                success: false,
                message: 'invoiceId not found!',
            });
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.json({
                success: false,
                message: 'invoice not found!',
            });
        }

        const invoiceUrl = invoice.invoiceUrl;
        const bucketName = process.env.BUCKET_NAME

        const result = await Invoice.deleteOne({ _id: invoiceId });
        // await deleteFromGCS(invoiceUrl, bucketName)

        res.json({ success: true, message: 'Invoice deleted!' });
    } catch (err) {
        console.error('Error deleting invoice:', error.message);
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
        const { tenantId, startDate, endDate } = req.body;

        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.json({
                success: false,
                message: 'Tenant not found!',
            });
        }

        let query = { tenantId: tenant._id };

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

exports.getPerDayInvoicesBwDates = async (req, res) => {
    try {
        const { tenantId, startDate, endDate } = req.body;

        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.json({
                success: false,
                message: 'Tenant not found!',
            });
        }

        const query = {
            tenantId: tenant._id,
            invoiceDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };

        const invoices = await Invoice.find(query);

        const allDates = generateDateRange(startDate, endDate);

        const invoicesSummary = allDates.reduce((summary, date) => {
            const formattedDate = formatDate(date);
            summary[formattedDate] = { count: 0, total: 0 };
            return summary;
        }, {});

        invoices.forEach(invoice => {
            const date = formatDate(invoice.invoiceDate);
            invoicesSummary[date].count++;
            invoicesSummary[date].total += parseFloat(invoice.total);
        });

        const formattedInvoices = Object.entries(invoicesSummary).map(([date, { count, total }]) => ({
            date,
            invoiceCount: count,
            invoiceValue: total
        }));

        res.json({ success: true, invoices: formattedInvoices });
    } catch (error) {
        console.error('Error fetching invoices:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getVendorsTotalBwDates = async (req, res) => {
    try {
        const { tenantId, startDate, endDate } = req.body;

        const CstartDate = new Date(startDate)
        const CendDate = new Date(endDate)

        const vendorsTotal = await Invoice.aggregate([
            {
                $match: {
                    tenantId: new mongoose.Types.ObjectId(tenantId),
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

const generateDateRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= new Date(endDate)) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates;
}

