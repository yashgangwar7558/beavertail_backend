const mongoose = require('mongoose');
const ingredientCostHistory = require('../models/ingredientCostHistory');

exports.createIngredientCostHistory = async (userId, ingredientId, cost, unit, date) => {
    try {
        const result = await ingredientCostHistory.create({
            userId,
            ingredientId,
            cost,
            unit,
            date
        })
        return result
    } catch (err) {
        console.log('Error creating ingredient cost history:', err.message);
        throw err
    }
}