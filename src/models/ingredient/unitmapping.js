const mongoose = require('mongoose');

const fromUnitSchema = new mongoose.Schema({
    unit: { type: String },
    conversion: { type: Number, required: true },
});

const unitmappingSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    ingredient_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Ingredient' },
    name: { type: String, required: true },
    fromUnit: [fromUnitSchema],
    toUnit: { type: String, required: true },
    description: { type: String, required: true}
})

unitmappingSchema.index({ tenantId: 1 });

const unitMapping = mongoose.model('unitMapping', unitmappingSchema);

module.exports = unitMapping;