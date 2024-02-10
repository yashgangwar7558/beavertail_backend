const mongoose = require('mongoose');
const User = require('../models/user');
const Recipe = require('../models/recipeBook');
const salesHistory = require('../models/salesHistory');
const { getBillsBetweenDates } = require('../controllers/sales')
const { getAllTypes } = require('../controllers/types')
const { findAverageCostForRecipeInDateRange } = require('../controllers/recipeCostHistory')
const { findAverageModifierCostForRecipeInDateRange } = require('../controllers/modifierCostHistory')
const { formatDate, formatMonthYear } = require('../controllers/helper');

exports.createSalesHistory = async (userId, recipeId, recipeName, billingId, billNumber, quantity, menuPrice, total, session) => {
    try {
        const result = await salesHistory.create([{
            userId,
            recipeId,
            recipeName,
            billingId,
            billNumber,
            quantity,
            menuPrice,
            total,
        }], {session})
        return result
    } catch (err) {
        console.log('Error creating sales history:', err.message);
        throw err
    }
}

exports.recipeWiseSalesDataBetweenDates = async (userId, startDate, endDate) => {
    try {
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

        const recipesSalesData = [];
        for (const recipeData of recipesData) {
            const matchingRecipe = recipesSales.find(
                (recipeSales) => recipeData._id.toString() === recipeSales._id.toString()
            );

            const avgCost = await findAverageCostForRecipeInDateRange(recipeData._id, startDate, endDate);
            const avgModifierCost = await findAverageModifierCostForRecipeInDateRange(recipeData._id, startDate, endDate);

            if (matchingRecipe) {
                const recipeSalesData = {
                    recipeId: recipeData._id,
                    name: recipeData.name,
                    type: recipeData.category,
                    imageUrl: recipeData.imageUrl,
                    avgCost: avgCost,
                    modifierCost: avgModifierCost,
                    quantitySold: matchingRecipe.quantitySold,
                    totalFoodCost: matchingRecipe.quantitySold * avgCost,
                    totalModifierCost: matchingRecipe.quantitySold * avgModifierCost,
                    totalSales: matchingRecipe.totalSales,
                    totalProfitWomc: matchingRecipe.totalSales - (matchingRecipe.quantitySold * avgCost),
                    totalProfitWmc: matchingRecipe.totalSales - (matchingRecipe.quantitySold * avgCost + matchingRecipe.quantitySold * avgModifierCost),
                    theoreticalCostWomc: ((matchingRecipe.quantitySold * avgCost) / matchingRecipe.totalSales) * 100,
                    theoreticalCostWmc: (((matchingRecipe.totalSales - (matchingRecipe.quantitySold * avgCost) + (matchingRecipe.quantitySold * avgModifierCost))) / matchingRecipe.totalSales) * 100
                }
                recipesSalesData.push(recipeSalesData);
            } else {
                const recipeSalesData = {
                    recipeId: recipeData._id,
                    name: recipeData.name,
                    type: recipeData.category,
                    imageUrl: recipeData.imageUrl,
                    avgCost: avgCost,
                    modifierCost: avgModifierCost,
                    quantitySold: 0,
                    totalFoodCost: 0,
                    totalModifierCost: 0,
                    totalSales: 0,
                    totalProfitWomc: 0,
                    totalProfitWmc: 0,
                    theoreticalCostWomc: 0,
                    theoreticalCostWmc: 0
                }
                recipesSalesData.push(recipeSalesData);
            }
        }

        return recipesSalesData;
    } catch (error) {
        console.error('Error fetching recipe wise sales info between dates:', error.message);
        throw error
    }
}

exports.typeWiseSalesDataBetweenDates = async (userId, startDate, endDate) => {
    try {
        // Recipe wise sales data 
        const allRecipesSalesData = await exports.recipeWiseSalesDataBetweenDates(userId, startDate, endDate)
        const recipeTypes = await getAllTypes(userId)

        // Type wise sales data
        const allTypesSalesData = recipeTypes.map((typeData) => {
            const { type, _id, imageUrl } = typeData;
            const typeRecipes = allRecipesSalesData.filter((recipe) => recipe.type === type);

            const typeSalesData = {
                type,
                _id,
                imageUrl,
                count: 0,
                avgCost: 0,
                quantitySold: 0,
                totalFoodCost: 0,
                totalModifierCost: 0,
                totalSales: 0,
                totalProfitWomc: 0,
                totalProfitWmc: 0,
                theoreticalCostWomc: 0,
                theoreticalCostWmc: 0
            };

            typeRecipes.forEach((recipe) => {
                typeSalesData.count++;
                typeSalesData.avgCost += recipe.avgCost;
                typeSalesData.quantitySold += recipe.quantitySold;
                typeSalesData.totalFoodCost += recipe.totalFoodCost;
                typeSalesData.totalModifierCost += recipe.totalModifierCost;
                typeSalesData.totalSales += recipe.totalSales;
                typeSalesData.totalProfitWomc += recipe.totalProfitWomc;
                typeSalesData.totalProfitWmc += recipe.totalProfitWmc;
                typeSalesData.theoreticalCostWomc += recipe.theoreticalCostWomc;
                typeSalesData.theoreticalCostWmc += recipe.theoreticalCostWmc;
            });

            if (typeSalesData.count > 0) {
                typeSalesData.avgCost /= typeSalesData.count;
                typeSalesData.theoreticalCostWomc /= typeSalesData.count;
                typeSalesData.theoreticalCostWmc /= typeSalesData.count;
            }

            return typeSalesData;
        });

        return allTypesSalesData;

    } catch (error) {
        console.error('Error fetching types wise sales info between dates:', error.message);
        throw error
    }
}

exports.typeWiseRecipeSalesDataBetweenDates = async (req, res) => {
    try {

        const { userId, startDate, endDate } = req.body

        const allRecipesSalesData = await exports.recipeWiseSalesDataBetweenDates(userId, startDate, endDate);
        const recipeTypes = await getAllTypes(userId)

        // Organize data by type
        const typeWiseSalesData = recipeTypes.map((typeData) => {
            const { type, _id, imageUrl } = typeData;
            const recipesOfType = allRecipesSalesData.filter((recipe) => recipe.type === type);

            return {
                type,
                _id,
                salesData: recipesOfType.map((recipe) => ({
                    recipeId: recipe.recipeId,
                    name: recipe.name,
                    imageUrl: recipe.imageUrl,
                    avgCost: recipe.avgCost,
                    modifierCost: recipe.modifierCost,
                    quantitySold: recipe.quantitySold,
                    totalFoodCost: recipe.totalFoodCost,
                    totalModifierCost: recipe.totalModifierCost,
                    totalSales: recipe.totalSales,
                    totalProfitWomc: recipe.totalProfitWomc,
                    totalProfitWmc: recipe.totalProfitWmc,
                    theoreticalCostWomc: recipe.theoreticalCostWomc,
                    theoreticalCostWmc: recipe.theoreticalCostWmc,
                })),
            };
        });

        res.json({ success: true, typeWiseSalesData });
    } catch (error) {
        console.error('Error calculating type wise recipe sales data:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.monthWiseRecipeSalesData = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body

        const CstartDate = new Date(startDate)
        const CendDate = new Date(endDate)

        const monthWiseSalesData = [];

        while (CstartDate <= CendDate) {
            const monthStartDate = new Date(CstartDate.getFullYear(), CstartDate.getMonth(), 1);
            const monthEndDate = new Date(CstartDate.getFullYear(), CstartDate.getMonth() + 1, 0);

            const salesData = await exports.recipeWiseSalesDataBetweenDates(userId, monthStartDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'), monthEndDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'));
            const monthyear = await formatMonthYear(monthStartDate)

            monthWiseSalesData.push({
                month: monthyear,
                salesData: salesData,
            });

            CstartDate.setMonth(CstartDate.getMonth() + 1);
        }

        res.json({ success: true, monthWiseSalesData });
    } catch (error) {
        console.error('Error calculating month wise sales data:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.monthWiseTypeSalesData = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body

        const CstartDate = new Date(startDate)
        const CendDate = new Date(endDate)

        const monthWiseSalesData = [];

        while (CstartDate <= CendDate) {
            const monthStartDate = new Date(CstartDate.getFullYear(), CstartDate.getMonth(), 1);
            const monthEndDate = new Date(CstartDate.getFullYear(), CstartDate.getMonth() + 1, 0);

            const salesData = await exports.typeWiseSalesDataBetweenDates(userId, monthStartDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'), monthEndDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'));
            const monthyear = await formatMonthYear(monthStartDate)

            monthWiseSalesData.push({
                month: monthyear,
                salesData: salesData,
            });

            CstartDate.setMonth(CstartDate.getMonth() + 1);
        }

        res.json({ success: true, monthWiseSalesData });
    } catch (error) {
        console.error('Error calculating month wise sales data:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.itemsSoldBetweenDates = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body

        const billingIds = await getBillsBetweenDates(userId, startDate, endDate)
        const extractedIds = billingIds.map(obj => obj._id);
        const itemsSold = await salesHistory.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    billingId: { $in: extractedIds }
                },
            },
            {
                $group: {
                    _id: null,
                    quantity: { $sum: '$quantity' },
                },
            },
        ]);

        res.json({ success: true, itemsSold: itemsSold.length > 0 ? itemsSold[0].quantity : 0 });
    } catch (error) {
        console.error('Error calculating total items sold between given duration:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.salesExpenseProfitBetweenDates = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body;

        const recipeSalesData = await exports.recipeWiseSalesDataBetweenDates(userId, startDate, endDate)

        let totalSales = 0;
        let totalExpense = 0;
        let totalProfit = 0;

        for (const recipeData of recipeSalesData) {
            totalSales += recipeData.totalSales;
            totalExpense += recipeData.totalFoodCost + recipeData.totalModifierCost;
            totalProfit += recipeData.totalProfitWmc;
        }

        res.json({
            success: true,
            totalSales: totalSales % 1 === 0 ? totalSales.toFixed(0) : totalSales.toFixed(2),
            totalExpense: totalExpense % 1 === 0 ? totalExpense.toFixed(0) : totalExpense.toFixed(2),
            totalProfit: totalProfit % 1 === 0 ? totalProfit.toFixed(0) : totalProfit.toFixed(2),
        });

    } catch (error) {
        console.error('Error calculating total sales, expense and profit between given duration:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.monthWiseSalesExpenseProfit = async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body

        const CstartDate = new Date(startDate)
        const CendDate = new Date(endDate)

        const monthWiseData = [];

        while (CstartDate <= CendDate) {
            const monthStartDate = new Date(CstartDate.getFullYear(), CstartDate.getMonth(), 1);
            const monthEndDate = new Date(CstartDate.getFullYear(), CstartDate.getMonth() + 1, 0);

            const recipeSalesData = await exports.recipeWiseSalesDataBetweenDates(userId, monthStartDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'), monthEndDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'));
            const monthyear = await formatMonthYear(monthStartDate)

            let totalSales = 0;
            let totalExpense = 0;
            let totalProfit = 0;

            for (const recipeData of recipeSalesData) {
                totalSales += recipeData.totalSales;
                totalExpense += recipeData.totalFoodCost + recipeData.totalModifierCost;
                totalProfit += recipeData.totalProfitWmc;
            }

            monthWiseData.push({
                month: monthyear,
                totalSales: totalSales % 1 === 0 ? totalSales.toFixed(0) : totalSales.toFixed(2),
                totalExpense: totalExpense % 1 === 0 ? totalExpense.toFixed(0) : totalExpense.toFixed(2),
                totalProfit: totalProfit % 1 === 0 ? totalProfit.toFixed(0) : totalProfit.toFixed(2),
            });

            CstartDate.setMonth(CstartDate.getMonth() + 1);
        }

        res.json({ success: true, monthWiseData });
    } catch (error) {
        console.error('Error calculating month wise sales, expense and profit data:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


