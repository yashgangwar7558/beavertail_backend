const mongoose = require('mongoose');
const User = require('../user/user');
const Recipe = require('../recipe/recipeBook');
const unitMapping = require('./unitmapping');
const recipeCostHistory = require('../recipe/recipeCostHistory');
const { log } = require('console');
const { inventoryCheck, costEstimation } = require('../../controllers/helper');
const { createRecipeCostHistory } = require('../../controllers/recipe/recipeCostHistory');

const ingredientSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  name: { type: String, required: true },
  category: { type: String },
  inventory: { type: Number, default: 0, required: true },
  invUnit: { type: String, required: true },
  avgCost: { type: Number, required: true },
  lastPurchasePrice: { type: Number, required: true },
  medianPurchasePrice: { type: Number, required: true},
  threshold: { type: Number, default: 0 },
  note: { type: String },
  shelfLife: { type: Number },
  slUnit: { type: String },
})

ingredientSchema.index({ tenantId: 1 })

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

module.exports = Ingredient;
