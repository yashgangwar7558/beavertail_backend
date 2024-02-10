const mongoose = require('mongoose');
const User = require('../models/user');
const purchaseHistory = require('../models/purchaseHistory');
const Invoice = require('../models/invoice');
const { formatDate } = require('../controllers/helper');
const { log } = require('console');

exports.createIngredientPurchaseHistory = async (userId, ingredientId, ingredientName, invoiceId, invoiceNumber, quantity, unit, unitPrice, total, session) => {
    try {
        const result = await purchaseHistory.create([{
            userId,
            ingredientId,
            ingredientName,
            invoiceId,
            invoiceNumber,
            quantity,
            unit,
            unitPrice,
            total
        }], {session})
        return result
    } catch (err) {
        console.log('Error creating purchase history:', err.message);
        throw err
    }
}

exports.getIngredientWisePurchaseHistory = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body;

        let query = { userId };

        if (startDate && endDate) {
            const invoices = await Invoice.find({
                userId,
                invoiceDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
            });
            const invoiceIdsArray = invoices.map(invoice => invoice._id);
            query = {
                userId,
                invoiceId: { $in: invoiceIdsArray },
            }
        }

        const ingPurchaseHistory = await purchaseHistory.find(query)
            .populate('ingredientId', 'name')
            .populate({
                path: 'invoiceId',
                model: 'Invoice',
                select: 'invoiceNumber vendor invoiceDate',
            });

        const formattedData = ingPurchaseHistory.map(entry => ({
            ingredient: { id: entry.ingredientId._id, name: entry.ingredientName },
            invoices: [{
                id: entry.invoiceId._id,
                invoiceNumber: entry.invoiceId.invoiceNumber,
                vendor: entry.invoiceId.vendor,
                invoiceDate: formatDate(entry.invoiceId.invoiceDate),
                quantity: entry.quantity,
                unit: entry.unit,
                unitPrice: entry.unitPrice,
                total: entry.total
            }]
        }));

        const history = formattedData.reduce((acc, entry) => {
            const existingEntry = acc.find(item => item.ingredient.id === entry.ingredient.id);
            if (existingEntry) {
                existingEntry.invoices.push(...entry.invoices);
            } else {
                acc.push(entry);
            }
            return acc;
        }, []);

        res.json({ success: true, history });
    } catch (error) {
        console.error('Error querying purchase history:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getAllPurchaseHistory = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found!',
            });
        }

        const history = await purchaseHistory.find({ userId: user._id });

        res.json({ success: true, history });
    } catch (error) {
        console.error('Error fetching purchase history:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.ingredientsTotalPurchaseBwDates = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body;

        const CstartDate = new Date(startDate)
        const CendDate = new Date(endDate)

        const invoices = await Invoice.find({
            userId,
            invoiceDate: {
                $gte: new Date(CstartDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
                $lte: new Date(CendDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
            },
        });
        const invoiceIdsArray = invoices.map(invoice => invoice._id);

        const ingredientsTotal = await purchaseHistory.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    invoiceId: { $in: invoiceIdsArray }
                },
            },
            {
              $group: {
                _id: '$ingredientId',
                ingredient: { $first: '$ingredientName' },
                totalQuantity: { $sum: '$quantity' },
                totalAmount: { $sum: { $toDouble: '$total' } },
              },
            },
          ]);

          res.json({ success: true, ingredientsTotal });
    } catch (error) {
        console.error('Error fetching ingredients total purchase:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

