const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Recipe = require('../models/recipeBook');
const salesHistory = require('../models/salesHistory');
const { createBill } = require('../controllers/sales')
const { createSalesHistory } = require('../controllers/salesHistory')
const { log } = require('console');

exports.processBill = async (req, res) => {
    try {
        const { userId, billNumber, customerName, billingDate, itemsOrdered, total } = req.body;

        // Process 1 - Sales table bill entry
        const bill = await createBill(
            userId,
            billNumber,
            customerName,
            billingDate,
            itemsOrdered,
            total
        )

        // Process 2 - Menu Item purchase history update
        const itemsOrderedNames = itemsOrdered.map(itemOrdered => itemOrdered.name);
        const AllMenuItems = await Recipe.find({ userId, name: { $in: itemsOrderedNames } });
        for (const itemOrdered of itemsOrdered) {
            const matchingRecipe = AllMenuItems.find(
                (menuItem) => menuItem.name === itemOrdered.name
            );

            const recipeSalesHistory = await createSalesHistory(
                userId,
                matchingRecipe._id,
                matchingRecipe.name,
                bill._id,
                billNumber,
                itemOrdered.quantity,
                itemOrdered.menuPrice,
                itemOrdered.total,
            )
        }

        return res.json({
            success: true,
            message: 'Bill processed successfully',
        });
    } catch (error) {
        console.error('Error processing bill:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}