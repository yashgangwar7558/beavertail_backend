const express = require('express');
const router = express.Router();

const {
    getIngredientWisePurchaseHistory,
    getAllPurchaseHistory,
    ingredientsTotalPurchaseBwDates
} = require('../../controllers/invoice/purchaseHistory')

const { isAuth } = require('../../middlewares/auth');

router.post('/get-ingredient-purchase-history', getIngredientWisePurchaseHistory);
router.post('/get-purchase-history', getAllPurchaseHistory);
router.post('/get-ingredients-total-purchase', ingredientsTotalPurchaseBwDates);

module.exports = router;