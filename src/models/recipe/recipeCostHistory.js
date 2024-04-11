const mongoose = require('mongoose');

const recipeCostHistorySchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    recipeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Recipes'},
    cost: {type: Number, required: true},
    date: {type: Date, required: true}
});

const recipeCostHistory = mongoose.model('recipeCostHistory', recipeCostHistorySchema);

module.exports = recipeCostHistory;