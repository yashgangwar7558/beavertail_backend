const mongoose = require('mongoose');

const modifierCostHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    recipeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Recipes'},
    cost: {type: Number, required: true},
    date: {type: Date, required: true}
});

const modifierCostHistory = mongoose.model('modifierCostHistory', modifierCostHistorySchema);

module.exports = modifierCostHistory;