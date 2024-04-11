const mongoose = require('mongoose');

const menuItemOrderedSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number },
    menuPrice: { type: Number },
    total: { type: Number }
});

const billSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    uploadDate: { type: Date, default: Date.now },
    billNumber: { type: String, required: true },
    customerName: { type: String},
    billingDate: { type: Date },
    itemsOrdered: [menuItemOrderedSchema],
    total: { type: String, required: true },
});

const Sales = mongoose.model('Sales', billSchema);

module.exports = Sales;