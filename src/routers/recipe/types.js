const express = require('express');
const router = express.Router();

const {
    createRecipeType,
    getAllTypes
} = require('../../controllers/recipe/types')

const { isAuth } = require('../../middlewares/auth');
const setTypesModel = require('../../middlewares/dynamicSchema/setTypesModel');

router.post('/create-recipe-type', createRecipeType);

router.post('/get-types', async (req, res) => {
    try {
        // const { Types } = req;
        const { tenantId } = req.body
        const types = await getAllTypes(tenantId)
        res.json({ success: true, types });
    } catch (error) {
        console.error('Error fetching recipe types:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;