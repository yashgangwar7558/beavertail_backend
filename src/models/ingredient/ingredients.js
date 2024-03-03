const mongoose = require('mongoose');
const User = require('../user/user');
const Recipe = require('../recipe/recipeBook');
const unitMapping = require('./unitmapping');
const recipeCostHistory = require('../recipe/recipeCostHistory');
const { log } = require('console');
const { inventoryCheck, costEstimation } = require('../../controllers/helper');
const { createRecipeCostHistory } = require('../../controllers/recipe/recipeCostHistory');

const ingredientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  category: { type: String },
  inventory: { type: Number, default: 0, required: true },
  invUnit: { type: String, required: true },
  avgCost: { type: Number, required: true },
  note: { type: String },
  shelfLife: { type: Number },
  slUnit: { type: String },
});

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

module.exports = Ingredient;
