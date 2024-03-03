const mongoose = require('mongoose');
const Types = require('../../models/recipe/types');
const User = require('../../models/user/user');
const setTypesModel = require('../../middlewares/dynamicSchema/setTypesModel');

exports.createRecipeType = async (req, res) => {
    try {
        const { Types } = req;
        const { userId, type, imageUrl } = req.body

        const result = await Types.create({
            userId,
            type,
            imageUrl
        })
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error creating recipe type:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getAllTypes = async (Types) => {
    try {
        const types = await Types.find({});

        const sortedTypes = types.sort((a, b) => a.type.localeCompare(b.type));

        return sortedTypes;
    } catch (error) {
        console.error('Error fetching recipe types:', error.message);
        throw error;
    }
};