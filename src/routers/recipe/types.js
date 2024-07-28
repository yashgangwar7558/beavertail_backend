const express = require('express');
const router = express.Router();

const {
    createRecipeType,
    getAllTypes,
    getAllSubTypesOfTypes,
    getAllSubTypes
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

router.post('/get-subtypes', async (req, res) => {
    try {
        // const { Types } = req;
        const { tenantId, type } = req.body
        const subTypes = await getAllSubTypesOfTypes(tenantId, type)
        res.json({ success: true, subTypes });
    } catch (error) {
        console.error('Error fetching recipe sub types:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/get-allsubtypes', async (req, res) => {
    try {
        // const { Types } = req;
        const { tenantId} = req.body
        const subTypes = await getAllSubTypes(tenantId)
        res.json({ success: true, subTypes });
    } catch (error) {
        console.error('Error fetching recipe sub types:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;