const express = require('express');
const router = express.Router();

const {
    createIngredient,
    getIngredient,
    getAllIngredient
} = require('../../controllers/ingredient/ingredients')

const { isAuth } = require('../../middlewares/auth');

router.post('/create-ingredient', createIngredient);
router.post('/get-ingredient', getIngredient);
router.post('/get-ingredients', getAllIngredient);

module.exports = router;