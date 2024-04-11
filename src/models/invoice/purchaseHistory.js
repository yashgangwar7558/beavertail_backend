const mongoose = require('mongoose');

const purchaseHistorySchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    ingredientId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Ingredient'},
    ingredientName: {type: String, required: true},
    invoiceId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Invoice'},
    invoiceNumber: { type: String, required: true},
    quantity: { type: Number },
    unit: { type: String },
    unitPrice: { type: Number },
    total: { type: String }
});

const purchaseHistory = mongoose.model('purchaseHistory', purchaseHistorySchema);

module.exports = purchaseHistory;