const mongoose = require('mongoose');
const User = require('../models/user');
const Recipe = require('../models/recipeBook');
const salesHistory = require('../models/salesHistory');
const { getBillsBetweenDates } = require('../controllers/sales')
const { findAverageCostForRecipeInDateRange } = require('../controllers/recipeCostHistory')
const { formatDate } = require('../controllers/helper');

exports.createSalesHistory = async (userId, recipeId, recipeName, billingId, billNumber, quantity, menuPrice, total) => {
    try {
        const result = await salesHistory.create({
            userId,
            recipeId,
            recipeName,
            billingId,
            billNumber,
            quantity,
            menuPrice,
            total,
        })
        return result
    } catch (err) {
        console.log('Error creating sales history:', err.message);
        throw err
    }
}

exports.getRecipeSalesInfo = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body

        // Recipe wise sales data 
        const recipesData = await Recipe.find({ userId: userId });
        let recipesSales = [];
        if (!startDate || !endDate) {
            recipesSales = await salesHistory.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(userId),
                    },
                },
                {
                    $group: {
                        _id: '$recipeId',
                        quantitySold: { $sum: '$quantity' },
                        totalSales: { $sum: '$total' }
                    }
                },
            ]);
        } else {
            const billingIds = await getBillsBetweenDates(userId, startDate, endDate)
            const extractedIds = billingIds.map(obj => obj._id);
            recipesSales = await salesHistory.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(userId),
                        billingId: { $in: extractedIds }
                    },
                },
                {
                    $group: {
                        _id: '$recipeId',
                        quantitySold: { $sum: '$quantity' },
                        totalSales: { $sum: '$total' }
                    }
                },
            ]);
        }

        const allRecipesSalesData = [];
        for (const recipeSales of recipesSales) {
            const matchingRecipe = recipesData.find(
                (recipeData) => recipeData._id.toString() === recipeSales._id.toString()
            );

            const avgCost = await findAverageCostForRecipeInDateRange(matchingRecipe._id, startDate, endDate);

            const recipeSalesData = {
                recipeId: matchingRecipe._id,
                name: matchingRecipe.name,
                type: matchingRecipe.category,
                avgCost: avgCost,
                modifierCost: matchingRecipe.modifierCost,
                quantitySold: recipeSales.quantitySold,
                totalFoodCost: recipeSales.quantitySold * avgCost,
                totalModifierCost: recipeSales.quantitySold * matchingRecipe.modifierCost,
                totalSales: recipeSales.totalSales,
                totalRevenueWomc: recipeSales.totalSales - (recipeSales.quantitySold * avgCost),
                totalRevenueWmc: recipeSales.totalSales - (recipeSales.quantitySold * avgCost + recipeSales.quantitySold * matchingRecipe.modifierCost),
                theoreticalCostWomc: ((recipeSales.quantitySold * avgCost) / recipeSales.totalSales) * 100,
                theoreticalCostWmc: (((recipeSales.totalSales - (recipeSales.quantitySold * avgCost) + (recipeSales.quantitySold * matchingRecipe.modifierCost))) / recipeSales.totalSales) * 100
            }

            allRecipesSalesData.push(recipeSalesData);;
        }

        // Type wise sales data
        const allTypesSalesData = allRecipesSalesData.reduce((acc, recipe) => {
            const { type, avgCost, quantitySold, totalFoodCost, totalModifierCost, totalSales, totalRevenueWomc, totalRevenueWmc, theoreticalCostWomc, theoreticalCostWmc } = recipe;

            if (!acc[type]) {
                acc[type] = {
                    count: 0,
                    avgCost: 0,
                    itemsSold: 0,
                    totalFoodCost: 0,
                    totalModifierCost: 0,
                    totalSales: 0,
                    totalRevenueWomc: 0,
                    totalRevenueWmc: 0,
                    theoreticalCostWomc: 0,
                    theoreticalCostWmc: 0
                };
            }

            acc[type].count++;
            acc[type].avgCost += avgCost;
            acc[type].itemsSold += quantitySold;
            acc[type].totalFoodCost += totalFoodCost;
            acc[type].totalModifierCost += totalModifierCost;
            acc[type].totalSales += totalSales;
            acc[type].totalRevenueWomc += totalRevenueWomc;
            acc[type].totalRevenueWmc += totalRevenueWmc;
            acc[type].theoreticalCostWomc += theoreticalCostWomc;
            acc[type].theoreticalCostWmc += theoreticalCostWmc;

            return acc;
        }, {});

        Object.keys(allTypesSalesData).forEach((type) => {
            const count = allTypesSalesData[type].count;
            allTypesSalesData[type].avgCost /= count;
            allTypesSalesData[type].theoreticalCostWomc /= count;
            allTypesSalesData[type].theoreticalCostWmc /= count;
        });

        const allTypesSalesDataArray = Object.keys(allTypesSalesData).map((type) => ({
            type,
            ...allTypesSalesData[type]
        }));

        res.json({ success: true, allTypesSalesDataArray, allRecipesSalesData });
    } catch (error) {
        console.error('Error fetching sales history:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getSalesHistory = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found!',
            });
        }

        const history = await salesHistory.find({ userId: user._id });

        res.json({ success: true, history });
    } catch (error) {
        console.error('Error fetching sales history:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};