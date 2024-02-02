const express = require('express');
const router = express.Router();

const {
    createRecipeType,
    getAllTypes
} = require('../controllers/types')

const { isAuth } = require('../middlewares/auth');

router.post('/create-recipe-type', createRecipeType);

router.post('/get-types', async (req, res) => {
    try {
        const { userId } = req.body
        const types = await getAllTypes(userId)
        res.json({ success: true, types });
    } catch (error) {
        console.error('Error fetching recipe types:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;