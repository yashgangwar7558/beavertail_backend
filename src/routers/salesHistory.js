const express = require('express');
const router = express.Router();

const {
    recipeWiseSalesDataBetweenDates,
    typeWiseSalesDataBetweenDates,
    typeWiseRecipeSalesDataBetweenDates,
    monthWiseRecipeSalesData,
    monthWiseTypeSalesData,
    itemsSoldBetweenDates,
    salesExpenseProfitBetweenDates,
    monthWiseSalesExpenseProfit
} = require('../controllers/salesHistory')

const { isAuth } = require('../middlewares/auth');

router.post('/get-recipewise-sales', async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body
        const allRecipesSalesData = await recipeWiseSalesDataBetweenDates(userId, startDate, endDate)
        res.json({ success: true, allRecipesSalesData });
    } catch (error) {
        console.error('Error fetching recipe wise sales history:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/get-typewise-sales', async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.body
        const allTypesSalesData = await typeWiseSalesDataBetweenDates(userId, startDate, endDate)
        res.json({ success: true, allTypesSalesData });
    } catch (error) {
        console.error('Error fetching type wise sales history:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/get-typewise-recipe-sales', typeWiseRecipeSalesDataBetweenDates)
router.post('/get-monthwise-recipe-sales', monthWiseRecipeSalesData)
router.post('/get-monthwise-type-sales', monthWiseTypeSalesData)


router.post('/get-items-sold', itemsSoldBetweenDates)
router.post('/get-sales-expense-profit', salesExpenseProfitBetweenDates)
router.post('/get-monthwise-sales-expense-profit', monthWiseSalesExpenseProfit)

module.exports = router;