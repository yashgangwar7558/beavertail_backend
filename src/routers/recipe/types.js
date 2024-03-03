const express = require('express');
const router = express.Router();

const {
    createRecipeType,
    getAllTypes
} = require('../../controllers/recipe/types')

const { isAuth } = require('../../middlewares/auth');
const setTypesModel = require('../../middlewares/dynamicSchema/setTypesModel');

router.post('/create-recipe-type', setTypesModel, createRecipeType);

router.post('/get-types', setTypesModel, async (req, res) => {
    try {
        const { Types } = req;
        const { userId } = req.body
        const types = await getAllTypes(Types)
        res.json({ success: true, types });
    } catch (error) {
        console.error('Error fetching recipe types:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;