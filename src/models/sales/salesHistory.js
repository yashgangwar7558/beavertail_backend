const mongoose = require('mongoose');

const salesHistorySchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    recipeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Recipes'},
    recipeName: {type: String, required: true},
    billingId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Sales'},
    billNumber: { type: String },
    quantity: { type: Number },
    menuPrice: { type: Number },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number },
    taxAmount: { type: Number, default: 0 },
    totalPayable: { type: String, required: true},
})

salesHistorySchema.index({ tenantId: 1, recipeId: 1 });
salesHistorySchema.index({ tenantId: 1, billingId: 1, recipeId: 1 });

const salesHistory = mongoose.model('salesHistory', salesHistorySchema);

module.exports = salesHistory