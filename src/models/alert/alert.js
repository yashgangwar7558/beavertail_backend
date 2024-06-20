const mongoose = require('mongoose');

// Define the alerts schema
const alertsSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    date: { type: Date, default: Date.now },
    type: { type: String, required: true },
    name: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, required: true },
    message: { type: String, required: true },
    severity: { type: String, required: true },
    reference: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
})

alertsSchema.index({ tenantId: 1 })
alertsSchema.index({ tenantId: 1, active: 1 })
alertsSchema.index({ date: -1 })

const alertTemplates = {
    'Price_Ingredient': {
        detailsKeys: ['ingredient_name', 'invoice_id', 'vendor_name', 'median_price', 'new_price', 'threshold', 'percent_change'],
        messageTemplate: (details) => `${details.ingredient_name} bought from ${details.vendor_name} crossed threshold price of ${details.threshold}%. Current price is ${details.percent_change}% more than median bought price.`,
        reference: '/ingredients'
    },
    'FoodCost_Type': {
        detailsKeys: ['type_name', 'threshold', 'type_foodCost'],
        messageTemplate: (details) => `${details.type_name} crossed its threshold foodcost of ${details.threshold}%. Current foodcost is ${details.type_foodCost}%`, 
        reference: '/foodcost'
    },
    'FoodCost_Item': {
        detailsKeys: ['item_name', 'threshold', 'item_foodCost'],
        messageTemplate: (details) => `${details.item_name} crossed its threshold foodcost of ${details.threshold}%. Current foodcost is ${details.item_foodCost}%`, 
        reference: '/foodcost'
    },
    'Margin_Type': {
        detailsKeys: ['type_name', 'threshold', 'type_margin'],
        messageTemplate: (details) => `${details.type_name} came below its threshold margin of ${details.threshold}% to ${details.type_margin}%`, 
        reference: '/margin'
    },
    'Margin_Item': {
        detailsKeys: ['item_name', 'threshold', 'item_margin'],
        messageTemplate: (details) => `${details.item_name} came below its threshold margin of ${details.threshold}% to ${details.item_margin}%`, 
        reference: '/margin'
    },
};

const Alert = mongoose.model('Alert', alertsSchema);

module.exports = { Alert, alertTemplates };