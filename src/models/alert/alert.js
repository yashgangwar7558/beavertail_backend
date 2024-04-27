const mongoose = require('mongoose');

// Define the alerts schema
const alertsSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    date: { type: Date, default: Date.now },
    type: { type: String, required: true },
    name: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, required: true },
    message: { type: String, required: true },
    reference: { type: String, required: true },
    read: { type: Boolean, required: true, default: false },
});

const alertTemplates = {
    'Price_Ingredient': {
        detailsKeys: ['ingredient_name', 'vendor_name', 'median_price', 'new_price', 'threshold', 'percent_change'],
        messageTemplate: (details) => `${details.ingredient_name} bought from ${details.vendor_name} crossed threshold price by ${details.percent_change}%. Earlier price was ${details.median_price}" and new price is "${details.new_price}.`,
        reference: '/ingredients'
    },
    'FoodCost_Type': {
        detailsKeys: ['type_name', 'threshold', 'type_foodcost'],
        messageTemplate: (details) => `${details.type_name} crossed its threshold foodcost of ${details.threshold}% by ${details.type_foodcost}%`, 
        reference: '/foodcost'
    },
    'FoodCost_Item': {
        detailsKeys: ['item_name', 'threshold', 'item_foodcost'],
        messageTemplate: (details) => `${details.item_name} crossed its threshold foodcost of ${details.threshold}% by ${details.item_foodcost}%`, 
        reference: '/foodcost'
    },
    'Margin_Type': {
        detailsKeys: ['type_name', 'threshold', 'type_margin'],
        messageTemplate: (details) => `${details.type_name} came below its threshold margin of ${details.threshold}% by ${details.type_margin}%`, 
        reference: '/margin'
    },
    'Margin_Item': {
        detailsKeys: ['item_name', 'threshold', 'item_margin'],
        messageTemplate: (details) => `${details.item_name} came below its threshold margin of ${details.threshold}% by ${details.item_margin}%`, 
        reference: '/margin'
    },
};

const Alert = mongoose.model('Alert', alertsSchema);

module.exports = { Alert, alertTemplates };