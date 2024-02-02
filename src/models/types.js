const mongoose = require('mongoose');

const recipeTypesSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    type: { type: String },
    imageUrl: { type: String }
});

const types = mongoose.model('types', recipeTypesSchema);

module.exports = types;