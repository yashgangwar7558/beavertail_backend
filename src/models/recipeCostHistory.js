const mongoose = require('mongoose');

const recipeCostHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    recipeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Recipes'},
    cost: {type: Number, required: true},
    date: {type: Date, required: true}
});

const recipeCostHistory = mongoose.model('recipeCostHistory', recipeCostHistorySchema);

module.exports = recipeCostHistory;