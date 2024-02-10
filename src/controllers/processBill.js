const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Recipe = require('../models/recipeBook');
const salesHistory = require('../models/salesHistory');
const { createBill } = require('../controllers/sales')
const { createSalesHistory } = require('../controllers/salesHistory')
const { log } = require('console');

exports.processBill = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const { userId, billNumber, customerName, billingDate, itemsOrdered, total } = req.body;

            let billCreated;

            // Process 1 - Sales table bill entry
            try {
                billCreated = await createBill(
                    userId,
                    billNumber,
                    customerName,
                    billingDate,
                    itemsOrdered,
                    total,
                    session
                )
            } catch (error) {
                throw new Error(`Error in creating sales, ${error.message}`)
            }

            // Process 2 - Menu Item purchase history update
            try {
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
                        billCreated[0]._id,
                        billNumber,
                        itemOrdered.quantity,
                        itemOrdered.menuPrice,
                        itemOrdered.total,
                        session
                    )
                }
            } catch (error) {
                throw new Error(`Error in creating sales history, ${error.message}`)
            }

            await session.commitTransaction();
            return res.json({
                success: true,
                message: 'Bill processed successfully',
            });
        })
    } catch (error) {
        console.error('Error processing bill:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        session.endSession();
    }
}