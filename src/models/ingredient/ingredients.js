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
  inventory: { type: Number, default: 0},
  invUnit: { type: String, required: true },
  avgCost: { type: Number, default: 0 },
  lastPurchasePrice: { type: Number, default: 0 },
  medianPurchasePrice: { type: Number, default: 0},
  threshold: { type: Number, default: 10 },
  note: { type: String },
  shelfLife: { type: Number },
  slUnit: { type: String },
})

ingredientSchema.index({ tenantId: 1 })

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

module.exports = Ingredient;
