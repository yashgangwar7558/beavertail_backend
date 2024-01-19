const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('../models/user');
const { inventoryCheck, costEstimation } = require('../controllers/helper');
const Recipe = require('../models/recipeBook');
const Ingredient = require('../models/ingredients');
const unitMapping = require('../models/unitmapping');
const recipeCostHistory = require('../models/recipeCostHistory');

exports.createRecipe = async (req, res) => {
    try {
        const { userId, name, category, methodPrep, modifierCost, menuPrice, menuType } = req.body;
        const ingredients = JSON.parse(req.body.ingredients)
        const yields = JSON.parse(req.body.yields)

        if (!userId || !name || !category || !yields || !methodPrep || !ingredients || !modifierCost || !menuPrice || !menuType) {
            return res.json({
                success: false,
                message: 'Some fields are missing!',
            });
        }

        // Calculate cost and inventory as per ingredients table and stock
        const AllIngredients = await Ingredient.find({ userId });
        const UnitMaps = await unitMapping.find({ userId });
        const inventory = await inventoryCheck(ingredients, AllIngredients, UnitMaps);
        const cost = await costEstimation(ingredients, AllIngredients, UnitMaps);

        // const inventory = true;
        // const cost = 30;

        if (req.file) {
            const { buffer } = req.file;
            const photoName = `${name}_${Date.now()}`;

            const photo = {
                name: photoName,
                img: {
                    data: buffer.toString('base64'),
                    contentType: req.file.mimetype,
                },
            };

            const recipe = await Recipe.create({
                userId,
                name,
                category,
                yields,
                photo,
                methodPrep,
                ingredients,
                cost,
                modifierCost,
                menuPrice,
                menuType,
                inventory,
            });

            const costHistory = await recipeCostHistory.create({
                userId,
                recipeId: recipe._id,
                cost,
                date: new Date()
            })

            res.json({ success: true, recipe });
        } else {
            return res.json({
                success: false,
                message: 'Recipe photo not provided!',
            });
        }
    } catch (error) {
        console.error('Error creating recipe:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updateRecipe = async (req, res) => {
    try {
        const { recipeId, userId, name, category, methodPrep, menuPrice, menuType } = req.body;
        const ingredients = JSON.parse(req.body.ingredients)
        const yields = JSON.parse(req.body.yields)
        console.log(req.body);

        if (!recipeId || !userId || !name || !category || !yields || !methodPrep || !ingredients || !menuPrice || !menuType) {
            return res.json({
                success: false,
                message: 'Some fields are missing!',
            });
        }

        // Calculate cost and inventory as per ingredients table and stock
        const AllIngredients = await Ingredient.find({ userId });
        const UnitMaps = await unitMapping.find({ userId });
        const inventory = await inventoryCheck(ingredients, AllIngredients, UnitMaps);
        const cost = await costEstimation(ingredients, AllIngredients, UnitMaps);

        // Ingredient update, cost history update
        const recipeBeforeUpdate = await Recipe.findById(recipeId);
        const ingredientsBeforeUpdate = JSON.stringify(recipeBeforeUpdate.ingredients);
        const ingredientsAfterUpdate = JSON.stringify(ingredients);
        if (ingredientsBeforeUpdate !== ingredientsAfterUpdate) {
            const costHistory = await recipeCostHistory.create({
                userId,
                recipeId,
                cost,
                date: new Date(),
            });
        }

        if (req.file) {
            const { buffer } = req.file;
            const photoName = `${name}_${Date.now()}`;

            const photo = {
                name: photoName,
                img: {
                    data: buffer.toString('base64'),
                    contentType: req.file.mimetype,
                },
            };

            const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, {
                userId,
                name,
                category,
                yields,
                photo,
                methodPrep,
                ingredients,
                cost,
                menuPrice,
                menuType,
                inventory,
            }, {
                new: true
            });

            res.json({ success: true, updatedRecipe });
        } else {
            const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, {
                userId,
                name,
                category,
                yields,
                methodPrep,
                ingredients,
                cost,
                menuPrice,
                menuType,
                inventory,
            }, {
                new: true
            });

            res.json({ success: true, updatedRecipe });
        }
    } catch (error) {
        console.error('Error updating recipe:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updateRelatedRecipes = async (ingredientId, userId) => {
    try {
        const recipesToUpdate = await Recipe.find({ 'ingredients.ingredient_id': ingredientId, userId: userId });
        console.log(recipesToUpdate);

        const AllIngredients = await Ingredient.find({ userId });
        const UnitMaps = await unitMapping.find({ userId });

        await Promise.all(recipesToUpdate.map(async (recipe) => {
            const newInventory = await inventoryCheck(recipe.ingredients, AllIngredients, UnitMaps);
            recipe.inventory = newInventory
            const newCost = await costEstimation(recipe.ingredients, AllIngredients, UnitMaps);
            recipe.cost = newCost
            console.log("Update recipe: ", recipe.name, newInventory, newCost);
            await recipe.save();
        }));

    } catch (error) {
        console.error(`Error updating related recipes: ${error}`);
    }
};

exports.getRecipe = async (req, res) => {
    try {
        const { recipeId } = req.body;

        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
            return res.json({
                success: false,
                message: 'Recipe not found!',
            });
        }

        res.json({ success: true, recipe });
    } catch (error) {
        console.error('Error fetching recipe:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getAllRecipe = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found!',
            });
        }

        const recipes = await Recipe.find({ userId: user._id });

        res.json({ success: true, recipes });
    } catch (error) {
        console.error('Error fetching recipes:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.deleteRecipe = async (req, res) => {
    try {
        const { recipeId } = req.body;

        if (!recipeId) {
            return res.json({
                success: false,
                message: 'RecipeId not found!',
            });
        }

        const result = await Recipe.deleteOne({ _id: recipeId });

        res.json({ success: true, message: 'Recipe deleted!' });
    } catch (error) {
        console.error('Error deleting recipe:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.findAverageCostForRecipeInDateRange = async (recipeId, startDate, endDate) => {
    try {
        const pipeline = [];

        if (startDate && endDate) {
            pipeline.push({
                $match: {
                    recipeId: new mongoose.Types.ObjectId(recipeId),
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                },
            });
        } else {
            pipeline.push({
                $match: {
                    recipeId: new mongoose.Types.ObjectId(recipeId),
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                averageCost: { $avg: '$cost' },
            },
        });

        const result = await recipeCostHistory.aggregate(pipeline);

        if (result.length > 0) {
            return result[0].averageCost;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error finding average cost:', error.message);
        throw error;
    }
};