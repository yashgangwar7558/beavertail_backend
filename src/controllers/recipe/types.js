const mongoose = require('mongoose');
const Types = require('../../models/recipe/types');
const User = require('../../models/user/user');
const setTypesModel = require('../../middlewares/dynamicSchema/setTypesModel');

exports.createRecipeType = async (req, res) => {
    try {
        // const { Types } = req;
        const { tenantId, type, imageUrl } = req.body

        const result = await Types.create({
            tenantId,
            type,
            imageUrl
        })
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error creating recipe type:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getAllTypes = async (tenantId) => {
    try {
        const types = await Types.find({ tenantId });

        const sortedTypes = types.sort((a, b) => a.type.localeCompare(b.type));

        return sortedTypes;
    } catch (error) {
        console.error('Error fetching recipe types:', error.message);
        throw error;
    }
};