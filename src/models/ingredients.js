const mongoose = require('mongoose');
const User = require('../models/user');
const Recipe = require('../models/recipeBook');
const unitMapping = require('../models/unitmapping');
const recipeCostHistory = require('../models/recipeCostHistory');
const { log } = require('console');
const { inventoryCheck, costEstimation } = require('../controllers/helper');
const { createRecipeCostHistory } = require('../controllers/recipeCostHistory');

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
