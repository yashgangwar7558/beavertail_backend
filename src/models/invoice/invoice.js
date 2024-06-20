const mongoose = require('mongoose');

const ingredientsBoughtSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number },
    unit: { type: String },
    unitPrice: { type: Number },
    total: { type: String }
});

const invoiceSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
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
})

invoiceSchema.index({ tenantId: 1, invoiceDate: 1 })
invoiceSchema.index({ tenantId: 1 })
invoiceSchema.index({ vendor: 1 })

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;