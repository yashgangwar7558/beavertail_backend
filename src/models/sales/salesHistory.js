const mongoose = require('mongoose');

const salesHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    recipeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Recipes'},
    recipeName: {type: String, required: true},
    billingId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Sales'},
    billNumber: { type: String, required: true},
    quantity: { type: Number },
    menuPrice: { type: Number },
    total: { type: Number }
});

const salesHistory = mongoose.model('salesHistory', salesHistorySchema);

module.exports = salesHistory;