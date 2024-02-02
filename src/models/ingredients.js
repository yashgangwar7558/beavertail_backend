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

ingredientSchema.post('save', async function (doc, next) {
  await updateRelatedRecipes(doc._id, doc.userId);
  next();
});

updateRelatedRecipes = async (ingredientId, userId) => {
  try {
    const recipesToUpdate = await Recipe.find({ 'ingredients.ingredient_id': ingredientId, userId: userId });

    const AllIngredients = await Ingredient.find({ userId });
    const UnitMaps = await unitMapping.find({ userId });

    await Promise.all(recipesToUpdate.map(async (recipe) => {
      const newInventory = await inventoryCheck(recipe.ingredients, AllIngredients, UnitMaps);
      recipe.inventory = newInventory
      const newCost = await costEstimation(recipe.ingredients, AllIngredients, UnitMaps);
      recipe.cost = newCost
      await recipe.save();

      const costHistory = await createRecipeCostHistory(userId, recipe._id, newCost, new Date('2024-01-11'))

    }));

  } catch (error) {
    console.error(`Error updating related recipes: ${error}`);
  }
};

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

module.exports = Ingredient;
