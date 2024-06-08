const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Recipe = require('../../models/recipe/recipeBook');
const salesHistory = require('../../models/sales/salesHistory');
const { createBill } = require('../sales/sales')
const { createSalesHistory } = require('../sales/salesHistory')

exports.processBill = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const { tenantId, billNumber, customerName, billingDate, itemsOrdered, total, taxPercent, totalPayable } = req.body;

            let billCreated;

            // Process 1 - Sales table bill entry
            try {
                billCreated = await createBill(
                    tenantId,
                    billNumber,
                    customerName,
                    billingDate,
                    itemsOrdered,
                    total,
                    taxPercent,
                    totalPayable,
                    session
                )
            } catch (error) {
                throw new Error(`Error in creating sales, ${error.message}`)
            }

            // Process 2 - Menu Item purchase history update
            try {
                const itemsOrderedNames = itemsOrdered.map(itemOrdered => itemOrdered.name);
                const AllMenuItems = await Recipe.find({ tenantId, name: { $in: itemsOrderedNames } });
                for (const itemOrdered of itemsOrdered) {
                    const matchingRecipe = AllMenuItems.find(
                        (menuItem) => menuItem.name === itemOrdered.name
                    );
                    const recipeSalesHistory = await createSalesHistory(
                        tenantId,
                        matchingRecipe._id,
                        matchingRecipe.name,
                        billCreated._id,
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