const mongoose = require('mongoose');

const modifierCostHistorySchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    recipeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Recipes'},
    cost: {type: Number, required: true},
    date: {type: Date, required: true}
})

modifierCostHistorySchema.index({ recipeId: 1, date: -1 })

const modifierCostHistory = mongoose.model('modifierCostHistory', modifierCostHistorySchema);

module.exports = modifierCostHistory;