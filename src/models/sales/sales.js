const mongoose = require('mongoose');

const menuItemOrderedSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number },
    menuPrice: { type: Number },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number },
    taxAmount: { type: Number, default: 0 },
    totalPayable: { type: String, required: true}, 
})

const billSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    billPosRef: { type: String },
    uploadDate: { type: Date, default: Date.now },
    billNumber: { type: String },
    customerName: { type: String },
    billingDate: { type: Date },
    itemsOrdered: [menuItemOrderedSchema],
    discountAmount: { type: Number, default: 0 },
    total: { type: String, required: true },
    taxAmount: { type: Number, default: 0 },
    totalPayable: { type: String, required: true},
})

billSchema.index({ tenantId: 1, billingDate: 1 });

const Sales = mongoose.model('Sales', billSchema);

module.exports = Sales;