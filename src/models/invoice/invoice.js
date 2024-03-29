const mongoose = require('mongoose');

const ingredientsBoughtSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number },
    unit: { type: String },
    unitPrice: { type: Number },
    total: { type: String }
});

const invoiceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    uploadDate: { type: Date, default: Date.now },
    invoiceNumber: { type: String, required: true },
    vendor: { type: String, required: true },
    invoiceDate: { type: Date },
    ingredients: [ingredientsBoughtSchema],
    payment: { type: String },
    status: {
        type: {
            type: String,
            default: 'Pending Review',
        },
        remark: String,
    },
    total: { type: String, required: true },
    invoiceUrl: { type: String, required: true },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;