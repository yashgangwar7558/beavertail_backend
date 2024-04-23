const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Tenant = require('../../models/tenant/tenant');
const purchaseHistory = require('../../models/invoice/purchaseHistory');
const Invoice = require('../../models/invoice/invoice');
const { formatDate, getConversionFactor } = require('../helper');
const { log } = require('console');

exports.createIngredientPurchaseHistory = async (tenantId, ingredientId, ingredientName, invoiceId, invoiceNumber, quantity, unit, unitPrice, total) => {
    try {
        const result = await purchaseHistory.create({
            tenantId,
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
        const { tenantId, startDate, endDate } = req.body;

        let query = { tenantId };

        if (startDate && endDate) {
            const invoices = await Invoice.find({
                tenantId,
                invoiceDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
            });
            const invoiceIdsArray = invoices.map(invoice => invoice._id);
            query = {
                tenantId,
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
        const { tenantId } = req.body;

        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.json({
                success: false,
                message: 'Tenant not found!',
            });
        }

        const history = await purchaseHistory.find({ tenantId: tenant._id });

        res.json({ success: true, history });
    } catch (error) {
        console.error('Error fetching purchase history:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.ingredientsTotalPurchaseBwDates = async (req, res) => {
    try {
        const { tenantId, startDate, endDate } = req.body;

        const CstartDate = new Date(startDate)
        const CendDate = new Date(endDate)

        const invoices = await Invoice.find({
            tenantId,
            invoiceDate: {
                $gte: new Date(CstartDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
                $lte: new Date(CendDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
            },
        });
        const invoiceIdsArray = invoices.map(invoice => invoice._id);

        const ingredientsTotal = await purchaseHistory.aggregate([
            {
                $match: {
                    tenantId: new mongoose.Types.ObjectId(tenantId),
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

exports.getIngredientMedianPurchasePrice = async (tenantId, dbIngredient, invoiceIngredient, unitMap) => {
    try {
        const records = await purchaseHistory
            .find({ ingredientId: dbIngredient._id })
            .sort({ createdAt: -1 })
            .limit(4);

        if (records.length === 0) {
            return 0
        }

        let totalWeightedPrice = (invoiceIngredient.unitPrice / getConversionFactor(invoiceIngredient.unit, unitMap.toUnit, unitMap.fromUnit)) * invoiceIngredient.quantity;
        let totalQuantity = invoiceIngredient.quantity;

        records.forEach((record) => {
            totalWeightedPrice += (record.unitPrice / getConversionFactor(record.unit, unitMap.toUnit, unitMap.fromUnit)) * record.quantity;
            totalQuantity += record.quantity;
        });

        const weightedAverageUnitPrice = (totalWeightedPrice / totalQuantity) * getConversionFactor(dbIngredient.invUnit, unitMap.toUnit, unitMap.fromUnit);
        return weightedAverageUnitPrice;
    } catch (error) {
        console.error('Error calculation ingredient median purchase history:', error.message);
        throw error;
    }
}

