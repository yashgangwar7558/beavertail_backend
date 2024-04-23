const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema({
  ingredient_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Ingredient' },
  name: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String },
  notes: { type: String },
});

const yieldsSchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  unit: { type: String },
});

const recipeSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  name: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  yields: [yieldsSchema],
  imageUrl: { type: String, required: true },
  methodPrep: { type: String },
  ingredients: [recipeIngredientSchema],
  cost: { type: Number },
  modifierCost: { type: Number},
  menuPrice: { type: Number },
  menuType: { type: String },
  inventory: { type: Boolean },
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
