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
    total: { type: String },
    createdAt: { type: Date, default: Date.now }
})

purchaseHistorySchema.index({ tenantId: 1, invoiceId: 1 });
purchaseHistorySchema.index({ tenantId: 1 });
purchaseHistorySchema.index({ ingredientId: 1 });
purchaseHistorySchema.index({ createdAt: 1 });

const purchaseHistory = mongoose.model('purchaseHistory', purchaseHistorySchema);

module.exports = purchaseHistory;