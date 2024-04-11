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
} = require('../../controllers/sales/salesHistory')

const { isAuth } = require('../../middlewares/auth');
const setTypesModel = require('../../middlewares/dynamicSchema/setTypesModel');

router.post('/get-recipewise-sales', async (req, res) => {
    try {
        const { tenantId, startDate, endDate } = req.body
        const allRecipesSalesData = await recipeWiseSalesDataBetweenDates(tenantId, startDate, endDate)
        res.json({ success: true, allRecipesSalesData });
    } catch (error) {
        console.error('Error fetching recipe wise sales history:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/get-typewise-sales', async (req, res) => {
    try {
        // const { Types } = req
        const { tenantId, startDate, endDate } = req.body
        const allTypesSalesData = await typeWiseSalesDataBetweenDates(tenantId, startDate, endDate)
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