const mongoose = require('mongoose');
const modifierCostHistory = require('../models/modifierCostHistory');

exports.createModifierCostHistory = async (userId, recipeId, cost, date) => {
    try {
        const result = await modifierCostHistory.create({
            userId,
            recipeId,
            cost,
            date
        })
        return result
    } catch (err) {
        console.log('Error creating modifier cost history:', err.message);
        throw err
    }
}