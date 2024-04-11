const mongoose = require('mongoose');

const ingredientCostHistorySchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    ingredientId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Ingredient'},
    cost: {type: Number, required: true},
    unit: {type: String, required: true},
    date: {type: Date, required: true}
});

const ingredientCostHistory = mongoose.model('ingredientCostHistory', ingredientCostHistorySchema);

module.exports = ingredientCostHistory;