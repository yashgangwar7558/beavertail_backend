const mongoose = require('mongoose');
const Types = require('../models/types');
const User = require('../models/user');

exports.createRecipeType = async (req, res) => {
    try {

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

exports.getAllTypes = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found!',
            });
        }

        const types = await Types.find({ userId: user._id });

        const sortedTypes = types.sort((a, b) => a.type.localeCompare(b.type));

        return sortedTypes;
    } catch (error) {
        console.error('Error fetching recipe types:', error.message);
        throw error;
    }
};