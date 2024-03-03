const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/user/user');
const unitMapping = require('../../models/ingredient/unitmapping');

exports.createUnitMap = async (req, res) => {
    try {
        const {userId, ingredient_id, name, fromUnit, toUnit, description} = req.body;
        if(!userId || !ingredient_id || !name || !fromUnit || !toUnit || !description) {
            return res.json({
                success: false,
                message: 'Some fields are missing!',
            });
        }
        const unitMap = await unitMapping.create({
            userId,
            ingredient_id,
            name,
            fromUnit,
            toUnit,
            description
        });

        res.json({ success: true, unitMap });
    } catch (err) {
        console.error('Error creating unitMap:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getUnitMap = async (req, res) => {
    try {
        const { ingredient_id } = req.body;

        // Find an ingredient by ID
        const unitMap = await unitMapping.findOne({ingredient_id});

        if (!unitMap) {
            return res.json({
                success: false,
                message: 'unitMap not found!',
            });
        }

        res.json({ success: true, unitMap });
    } catch (error) {
        console.error('Error fetching unitMap:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getAllUnitMaps = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found!',
            });
        }

        // Find all ingredients with the specified user ID
        const unitMaps = await unitMapping.find({ userId: user._id });

        res.json({ success: true, unitMaps });
    } catch (error) {
        console.error('Error fetching unitMaps:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};