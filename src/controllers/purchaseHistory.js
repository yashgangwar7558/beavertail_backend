const mongoose = require('mongoose');
const User = require('../models/user');
const purchaseHistory = require('../models/purchaseHistory');
const { formatDate } = require('../controllers/helper');
const { log } = require('console');

exports.createIngredientPurchaseHistory = async (userId, ingredientId, ingredientName, invoiceId, invoiceNumber, quantity, unit, unitPrice, total) => {
    try {
        const result = await purchaseHistory.create({
            userId,
            ingredientId,
            ingredientName,
            invoiceId,
            invoiceNumber,
            quantity,
            unit,
            unitPrice,
            total
        })
        return result
    } catch (err) {
        console.log('Error creating purchase history:', err.message);
        throw err
    }
}

exports.getIngredientWisePurchaseHistory = async (req, res) => {
    try {
        const { userId } = req.body;

        const ingPurchaseHistory = await purchaseHistory.find({ userId })
            .populate('ingredientId', 'name')
            .populate({
                path: 'invoiceId',
                model: 'Invoice',
                select: 'invoiceNumber vendor uploadDate',
            });

        const formattedData = ingPurchaseHistory.map(entry => ({
            ingredient: { id: entry.ingredientId._id, name: entry.ingredientName },
            invoices: [{
                id: entry.invoiceId._id,
                invoiceNumber: entry.invoiceId.invoiceNumber,
                vendor: entry.invoiceId.vendor,
                uploadDate: formatDate(entry.invoiceId.uploadDate),
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