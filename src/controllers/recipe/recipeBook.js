const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Tenant = require('../../models/tenant/tenant');
const Recipe = require('../../models/recipe/recipeBook');
const Ingredient = require('../../models/ingredient/ingredients');
const unitMapping = require('../../models/ingredient/unitmapping');
const { Alert } = require('../../models/alert/alert')
const { createRecipeCostHistory } = require('../recipe/recipeCostHistory');
const { createModifierCostHistory } = require('../recipe/modifierCostHistory');
const { recipeWiseSalesDataBetweenDates, typeWiseSalesDataBetweenDates } = require('../sales/salesHistory')
const { inventoryCheck, costEstimation, uploadToS3, deleteFromS3, uploadToGCS, deleteFromGCS } = require('../helper');
const { createAlert } = require('../../controllers/alert/alert')

exports.createRecipe = async (req, res) => {
    try {
        const { tenantId, name, category, subCategory, yields, methodPrep, ingredients, modifierCost, menuPrice, menuType } = req.body

        const existingRecipe = await Recipe.findOne({ name, tenantId })

        if (existingRecipe) {
            return res.json({
                success: false,
                message: 'Recipe already exists!',
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
                subCategory,
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
                message: 'Recipe image not provided!',
            });
        }
    } catch (error) {
        console.error('Error creating recipe:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.storeExtractedRecipes = async (tenantId, recipesJson, session) => {
    try {
        if (!tenantId || !Array.isArray(recipesJson)) {
            throw new Error('Missing tenantId or recipesJson is not valid!')
        }

        const ingredients = await Ingredient.find({ tenantId }).session(session)
        const ingredientIdMap = ingredients.reduce((acc, ingredient) => {
            acc[ingredient.name] = ingredient._id
            return acc
        }, {})

        for (const recipe of recipesJson) {
            const { name, category, subCategory, methodPrep, menuPrice, ingredients } = recipe

            const ingredientsWithIds = ingredients.map(ingredient => {
                const ingredientId = ingredientIdMap[ingredient.name]
                if (!ingredientId) {
                    throw new Error(`Ingredient ${ingredient.name} not found for recipe ${recipe.name}`);
                }
                return {
                    ...ingredient,
                    ingredient_id: ingredientId
                }
            })

            await Recipe.create({
                tenantId,
                name,
                category,
                subCategory,
                methodPrep,
                ingredients: ingredientsWithIds,
                menuPrice,
            })
        }

        return true
    } catch (error) {
        console.error('Error storing extracted recipes:', error.message)
        throw error
    }
}

exports.updateRecipe = async (req, res) => {
    try {
        const { recipeId, imageUrl, tenantId, name, category, subCategory, yields, methodPrep, ingredients, modifierCost, menuPrice, menuType } = req.body
        const existingRecipe = await Recipe.findById(recipeId)
        if (!existingRecipe) {
            return res.json({
                success: false,
                message: 'Recipe does not exist',
            })
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
            if (imageUrl) {
                try {
                    await deleteFromGCS(imageUrl, bucketName);
                } catch (error) {
                    console.error('Failed to delete old image. Proceeding with upload.');
                }
            }
            const newimageUrl = await uploadToGCS(buffer, fileName, fileType, bucketName, folderPath)
            // const newimageUrl = 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZG9zYXxlbnwwfHwwfHx8MA%3D%3D'

            const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, {
                tenantId,
                name,
                category,
                subCategory,
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

            res.json({ success: true, updatedRecipe })
            await exports.checkRecipesThreshold(tenantId)
        } else {
            const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, {
                tenantId,
                name,
                category,
                subCategory,
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

            res.json({ success: true, updatedRecipe })
            await exports.checkRecipesThreshold(tenantId)
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
        const result = await updateRecipe.save({ session });
        return result;
    } catch (error) {
        console.error(`Error updating related recipes: ${error}`);
        throw error;
    }
};

exports.getRecipe = async (req, res) => {
    try {
        // const { recipeId } = req.body;
        // const recipe = await Recipe.findById(recipeId);

        const { tenantId, recipeName } = req.body;
        const recipe = await Recipe.findOne({ tenantId, name: recipeName })

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

exports.getSubTypeRecipe = async (req, res) => {
    try {
        const { tenantId, subCategory } = req.body;

        if (!tenantId || !subCategory) {
            return res.status(400).json({
                success: false,
                message: 'Missing tenantId or subType!',
            });
        }

        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found!',
            });
        }

        const recipes = await Recipe.find({ tenantId: tenant._id, subCategory })

        res.json({ success: true, recipes });
    } catch (error) {
        console.error('Error fetching subtype recipes:', error.message);
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

exports.checkRecipesThreshold = async (tenantId, startDate, endDate) => {
    try {
        const recipesSalesData = await recipeWiseSalesDataBetweenDates(tenantId, startDate, endDate);
        const typesSalesData = await typeWiseSalesDataBetweenDates(tenantId, startDate, endDate);

        const foodcost_threshold = 30
        const margin_threshold = 30

        const thresholds = {
            foodCost: {
                low: 30,
                medium: 35,
                critical: 40
            },
            margin: {
                low: 30,
                medium: 25,
                critical: 20
            }
        };

        let details = {}
        for (const recipe of recipesSalesData) {
            if (recipe.quantitySold !== 0) {
                const existingFoodCostItemAlert = await Alert.findOne({ tenantId, type: 'FoodCost_Item', 'details.item_name': recipe.name, active: true })
                if (recipe.theoreticalCostWomc >= thresholds.foodCost.critical) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.foodCost.low,
                        item_foodCost: recipe.theoreticalCostWomc.toFixed(2)
                    }
                    if (existingFoodCostItemAlert) {
                        await Alert.findByIdAndDelete(existingFoodCostItemAlert._id);
                        await createAlert(tenantId, 'FoodCost_Item', 'High Foodcost', details, 'Critical');
                    } else {
                        await createAlert(tenantId, 'FoodCost_Item', 'High Foodcost', details, 'Critical');
                    }
                } else if (recipe.theoreticalCostWomc >= thresholds.foodCost.medium) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.foodCost.low,
                        item_foodCost: recipe.theoreticalCostWomc.toFixed(2)
                    }
                    if (existingFoodCostItemAlert) {
                        await Alert.findByIdAndDelete(existingFoodCostItemAlert._id);
                        await createAlert(tenantId, 'FoodCost_Item', 'High Foodcost', details, 'Medium');
                    } else {
                        await createAlert(tenantId, 'FoodCost_Item', 'High Foodcost', details, 'Medium');
                    }
                } else if (recipe.theoreticalCostWomc >= thresholds.foodCost.low) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.foodCost.low,
                        item_foodCost: recipe.theoreticalCostWomc.toFixed(2)
                    }
                    if (existingFoodCostItemAlert) {
                        await Alert.findByIdAndDelete(existingFoodCostItemAlert._id);
                        await createAlert(tenantId, 'FoodCost_Item', 'High Foodcost', details, 'Low');
                    } else {
                        await createAlert(tenantId, 'FoodCost_Item', 'High Foodcost', details, 'Low');
                    }
                } else {
                    if (existingFoodCostItemAlert) {
                        await Alert.findByIdAndUpdate(existingFoodCostItemAlert._id, { $set: { active: false } });
                    }
                }
            }
            if (recipe.quantitySold !== 0) {
                const existingMarginItemAlert = await Alert.findOne({ tenantId, type: 'Margin_Item', 'details.item_name': recipe.name, active: true })
                if (recipe.theoreticalCostWmc <= thresholds.margin.critical) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.margin.low,
                        item_margin: recipe.theoreticalCostWmc.toFixed(2)
                    }
                    if (existingMarginItemAlert) {
                        await Alert.findByIdAndDelete(existingMarginItemAlert._id);
                        await createAlert(tenantId, 'Margin_Item', 'Low Margin', details, 'Critical');
                    } else {
                        await createAlert(tenantId, 'Margin_Item', 'Low Margin', details, 'Critical');
                    }
                } else if (recipe.theoreticalCostWmc <= thresholds.margin.medium) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.margin.low,
                        item_margin: recipe.theoreticalCostWmc.toFixed(2)
                    }
                    if (existingMarginItemAlert) {
                        await Alert.findByIdAndDelete(existingMarginItemAlert._id);
                        await createAlert(tenantId, 'Margin_Item', 'Low Margin', details, 'Medium');
                    } else {
                        await createAlert(tenantId, 'Margin_Item', 'Low Margin', details, 'Medium');
                    }
                } else if (recipe.theoreticalCostWmc <= thresholds.margin.low) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.margin.low,
                        item_margin: recipe.theoreticalCostWmc.toFixed(2)
                    }
                    if (existingMarginItemAlert) {
                        await Alert.findByIdAndDelete(existingMarginItemAlert._id);
                        await createAlert(tenantId, 'Margin_Item', 'Low Margin', details, 'Low');
                    } else {
                        await createAlert(tenantId, 'Margin_Item', 'Low Margin', details, 'Low');
                    }
                } else {
                    if (existingMarginItemAlert) {
                        await Alert.findByIdAndUpdate(existingMarginItemAlert._id, { $set: { active: false } });
                    }
                }
            }
        }
        for (const type of typesSalesData) {
            if (type.quantitySold !== 0) {
                const existingFoodCostTypeAlert = await Alert.findOne({ tenantId, type: 'FoodCost_Type', 'details.type_name': type.subType, active: true })
                if (type.theoreticalCostWomc > thresholds.foodCost.critical) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.foodCost.low,
                        type_foodCost: type.theoreticalCostWomc.toFixed(2)
                    }
                    if (existingFoodCostTypeAlert) {
                        await Alert.findByIdAndDelete(existingFoodCostTypeAlert._id);
                        await createAlert(tenantId, 'FoodCost_Type', 'High Foodcost', details, 'Critical');
                    } else {
                        await createAlert(tenantId, 'FoodCost_Type', 'High Foodcost', details, 'Critical');
                    }
                } else if (type.theoreticalCostWomc > thresholds.foodCost.medium) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.foodCost.low,
                        type_foodCost: type.theoreticalCostWomc.toFixed(2)
                    }
                    if (existingFoodCostTypeAlert) {
                        await Alert.findByIdAndDelete(existingFoodCostTypeAlert._id);
                        await createAlert(tenantId, 'FoodCost_Type', 'High Foodcost', details, 'Medium');
                    } else {
                        await createAlert(tenantId, 'FoodCost_Type', 'High Foodcost', details, 'Medium');
                    }
                } else if (type.theoreticalCostWomc > thresholds.foodCost.low) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.foodCost.low,
                        type_foodCost: type.theoreticalCostWomc.toFixed(2)
                    }
                    if (existingFoodCostTypeAlert) {
                        await Alert.findByIdAndDelete(existingFoodCostTypeAlert._id);
                        await createAlert(tenantId, 'FoodCost_Type', 'High Foodcost', details, 'Low');
                    } else {
                        await createAlert(tenantId, 'FoodCost_Type', 'High Foodcost', details, 'Low');
                    }
                } else {
                    if (existingFoodCostTypeAlert) {
                        await Alert.findByIdAndUpdate(existingFoodCostTypeAlert._id, { $set: { active: false } });
                    }
                }
            }
            if (type.quantitySold !== 0) {
                const existingMarginTypeAlert = await Alert.findOne({ tenantId, type: 'Margin_Type', 'details.type_name': type.subType, active: true })
                if (type.theoreticalCostWmc < thresholds.margin.critical) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.margin.low,
                        type_margin: type.theoreticalCostWmc.toFixed(2)
                    }
                    if (existingMarginTypeAlert) {
                        await Alert.findByIdAndDelete(existingMarginTypeAlert._id);
                        await createAlert(tenantId, 'Margin_Type', 'Low Margin', details, 'Critical');
                    } else {
                        await createAlert(tenantId, 'Margin_Type', 'Low Margin', details, 'Critical');
                    }
                } else if (type.theoreticalCostWmc < thresholds.margin.medium) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.margin.low,
                        type_margin: type.theoreticalCostWmc.toFixed(2)
                    }
                    if (existingMarginTypeAlert) {
                        await Alert.findByIdAndDelete(existingMarginTypeAlert._id);
                        await createAlert(tenantId, 'Margin_Type', 'Low Margin', details, 'Medium');
                    } else {
                        await createAlert(tenantId, 'Margin_Type', 'Low Margin', details, 'Medium');
                    }
                } else if (type.theoreticalCostWmc < thresholds.margin.low) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.margin.low,
                        type_margin: type.theoreticalCostWmc.toFixed(2)
                    }
                    if (existingMarginTypeAlert) {
                        await Alert.findByIdAndDelete(existingMarginTypeAlert._id);
                        await createAlert(tenantId, 'Margin_Type', 'Low Margin', details, 'Low');
                    } else {
                        await createAlert(tenantId, 'Margin_Type', 'Low Margin', details, 'Low');
                    }
                } else {
                    if (existingMarginTypeAlert) {
                        await Alert.findByIdAndUpdate(existingMarginTypeAlert._id, { $set: { active: false } });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking menu item for threshold:', error.message);
        throw error;
    }
}




