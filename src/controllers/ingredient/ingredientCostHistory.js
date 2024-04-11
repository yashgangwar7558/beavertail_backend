const mongoose = require('mongoose');
const ingredientCostHistory = require('../../models/ingredient/ingredientCostHistory');

exports.createIngredientCostHistory = async (tenantId, ingredientId, cost, unit, date, session) => {
    try {
        const result = await ingredientCostHistory.create([{
            tenantId,
            ingredientId,
            cost,
            unit,
            date: date.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
        }], {session})
        return result[0]
    } catch (err) {
        console.log('Error creating ingredient cost history:', err.message);
        throw err
    }
}