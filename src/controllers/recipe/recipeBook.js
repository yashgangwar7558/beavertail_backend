const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Tenant = require('../../models/tenant/tenant');
const Recipe = require('../../models/recipe/recipeBook');
const Ingredient = require('../../models/ingredient/ingredients');
const unitMapping = require('../../models/ingredient/unitmapping');
const { createRecipeCostHistory } = require('../recipe/recipeCostHistory');
const { createModifierCostHistory } = require('../recipe/modifierCostHistory');
const { inventoryCheck, costEstimation, uploadToS3, deleteFromS3, uploadToGCS, deleteFromGCS } = require('../helper');

exports.createRecipe = async (req, res) => {
    try {
        const { tenantId, name, category, methodPrep, modifierCost, menuPrice, menuType } = req.body;
        const ingredients = JSON.parse(req.body.ingredients)
        const yields = JSON.parse(req.body.yields)

        if (!tenantId || !name || !category || !yields || !methodPrep || !ingredients || !modifierCost || !menuPrice || !menuType) {
            return res.json({
                success: false,
                message: 'Some fields are missing!',
            });
        }

        // Calculate cost and inventory as per ingredients table and stock
        const AllIngredients = await Ingredient.find({ tenantId });
        const UnitMaps = await unitMapping.find({ tenantId });
        const inventory = await inventoryCheck(ingredients, AllIngredients, UnitMaps);
        const cost = await costEstimation(ingredients, AllIngredients, UnitMaps);

        // const inventory = true;
        // const cost = 30;

        if (req.file) {
            const { buffer } = req.file;
            const fileName = `${name}_${Date.now()}`
            const fileType = req.file.mimetype
            const bucketName = process.env.BUCKET_NAME
            const folderPath = 'recipes'
            const imageUrl = await uploadToGCS(buffer, fileName, fileType, bucketName, folderPath)
            // const imageUrl = 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZG9zYXxlbnwwfHwwfHx8MA%3D%3D'

            const recipe = await Recipe.create({
                tenantId,
                name,
                category,
                yields,
                imageUrl,
                methodPrep,
                ingredients,
                cost,
                modifierCost,
                menuPrice,
                menuType,
                inventory,
            });

            const recipeCostHistory = await createRecipeCostHistory(tenantId, recipe._id, cost, new Date())
            const modifierCostHistory = await createModifierCostHistory(tenantId, recipe._id, modifierCost, new Date())

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
        const { recipeId, imageUrl, tenantId, name, category, methodPrep, modifierCost, menuPrice, menuType } = req.body;
        const ingredients = JSON.parse(req.body.ingredients)
        const yields = JSON.parse(req.body.yields)

        if (!recipeId || !imageUrl || !tenantId || !name || !category || !yields || !methodPrep || !ingredients || !modifierCost || !menuPrice || !menuType) {
            return res.json({
                success: false,
                message: 'Some fields are missing!',
            });
        }

        // Calculate cost and inventory as per ingredients table and stock
        const AllIngredients = await Ingredient.find({ tenantId });
        const UnitMaps = await unitMapping.find({ tenantId });
        const inventory = await inventoryCheck(ingredients, AllIngredients, UnitMaps);
        const cost = await costEstimation(ingredients, AllIngredients, UnitMaps);

        // Ingredient update, cost history update
        const recipeBeforeUpdate = await Recipe.findById(recipeId);
        const ingredientsBeforeUpdate = JSON.stringify(recipeBeforeUpdate.ingredients);
        const ingredientsAfterUpdate = JSON.stringify(ingredients);
        if (ingredientsBeforeUpdate !== ingredientsAfterUpdate) {
            const costHistory = await createRecipeCostHistory(tenantId, recipeId, cost, new Date())
        }

        const modifierCostBeforeUpdate = recipeBeforeUpdate.modifierCost
        const modifierCostAfterUpdate = modifierCost
        if (modifierCostBeforeUpdate !== modifierCostAfterUpdate) {
            const modifierCostHistory = await createModifierCostHistory(tenantId, recipeId, modifierCost, new Date())
        }

        if (req.file) {
            const { buffer } = req.file;
            const fileName = `${name}_${Date.now()}`
            const fileType = req.file.mimetype
            const bucketName = process.env.BUCKET_NAME
            const folderPath = 'recipes'
            await deleteFromGCS(imageUrl, bucketName)
            const newimageUrl = await uploadToGCS(buffer, fileName, fileType, bucketName, folderPath)
            // const newimageUrl = 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZG9zYXxlbnwwfHwwfHx8MA%3D%3D'

            const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, {
                tenantId,
                name,
                category,
                yields,
                imageUrl: newimageUrl,
                methodPrep,
                ingredients,
                cost,
                modifierCost,
                menuPrice,
                menuType,
                inventory,
            }, {
                new: true
            });

            res.json({ success: true, updatedRecipe });
        } else {
            const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, {
                tenantId,
                name,
                category,
                yields,
                imageUrl,
                methodPrep,
                ingredients,
                cost,
                modifierCost,
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

exports.updateRecipesCostInventory = async (tenantId, recipeId, newInventory, newCost, session) => {
    try {
        const updateRecipe = await Recipe.findById(recipeId);
        updateRecipe.cost = newCost;
        updateRecipe.inventory = newInventory;
        const result = await updateRecipe.save({session});
        return result;
    } catch (error) {
        console.error(`Error updating related recipes: ${error}`);
        throw error;
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
        const { tenantId } = req.body;

        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.json({
                success: false,
                message: 'Tenant not found!',
            });
        }

        const recipes = await Recipe.find({ tenantId: tenant._id });

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

        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.json({
                success: false,
                message: 'Recipe not found!',
            });
        }

        const imageUrl = recipe.imageUrl; 
        const bucketName = process.env.BUCKET_NAME

        const result = await Recipe.deleteOne({ _id: recipeId });
        await deleteFromGCS(imageUrl, bucketName)

        res.json({ success: true, message: 'Recipe deleted!' });
    } catch (error) {
        console.error('Error deleting recipe:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

