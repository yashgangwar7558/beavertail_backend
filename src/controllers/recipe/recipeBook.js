const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Tenant = require('../../models/tenant/tenant');
const Recipe = require('../../models/recipe/recipeBook');
const Ingredient = require('../../models/ingredient/ingredients');
const unitMapping = require('../../models/ingredient/unitmapping');
const { createRecipeCostHistory } = require('../recipe/recipeCostHistory');
const { createModifierCostHistory } = require('../recipe/modifierCostHistory');
const { recipeWiseSalesDataBetweenDates, typeWiseSalesDataBetweenDates } = require('../sales/salesHistory')
const { inventoryCheck, costEstimation, uploadToS3, deleteFromS3, uploadToGCS, deleteFromGCS } = require('../helper');
const { createAlert } = require('../../controllers/alert/alert')

exports.createRecipe = async (req, res) => {
    try {
        const { tenantId, name, category, subCategory, methodPrep, modifierCost, menuPrice, menuType } = req.body;
        const ingredients = JSON.parse(req.body.ingredients)
        const yields = JSON.parse(req.body.yields)

        const missingFields = [];

        if (!tenantId) missingFields.push('User unauthenticated');
        if (!name) missingFields.push('Recipe Name');
        if (!category) missingFields.push('Recipe Type');
        if (!subCategory) missingFields.push('Recipe Sub Type');
        if (!methodPrep) missingFields.push('Method of Preperation');
        if (!modifierCost) missingFields.push('Modifier Cost');
        if (!menuPrice) missingFields.push('Menu Price');
        if (!menuType) missingFields.push('Menu Type');
        if (!yields) missingFields.push('Yields');
        if (ingredients.length == 0) missingFields.push('Ingredients');

        if (missingFields.length > 0) {
            return res.json({
                success: false,
                message: `Missing fields: ${missingFields.join(', ')}`,
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

exports.updateRecipe = async (req, res) => {
    try {
        const { recipeId, imageUrl, tenantId, name, category, subCategory, methodPrep, modifierCost, menuPrice, menuType } = req.body;
        const ingredients = JSON.parse(req.body.ingredients)
        const yields = JSON.parse(req.body.yields)

        const missingFields = [];

        if (!tenantId) missingFields.push('User unauthenticated');
        if (!recipeId) missingFields.push('Recipe does not exist');
        if (!imageUrl) missingFields.push('Media');
        if (!name) missingFields.push('Recipe Name');
        if (!category) missingFields.push('Recipe Type');
        if (!subCategory) missingFields.push('Recipe Sub Type');
        if (!methodPrep) missingFields.push('Method of Preperation');
        if (!modifierCost) missingFields.push('Modifier Cost');
        if (!menuPrice) missingFields.push('Menu Price');
        if (!menuType) missingFields.push('Menu Type');
        if (!yields) missingFields.push('Yields');
        if (ingredients.length == 0) missingFields.push('Ingredients');

        if (missingFields.length > 0) {
            return res.json({
                success: false,
                message: `Missing fields: ${missingFields.join(', ')}`,
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

        const {tenantId, recipeName} = req.body;
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
                if (recipe.theoreticalCostWomc >= thresholds.foodCost.critical) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.foodCost.low,
                        item_foodcost: recipe.theoreticalCostWomc.toFixed(2)
                    }
                    await createAlert(tenantId, 'FoodCost_Item', 'High Foodcost', details, 'Critical');
                } else if (recipe.theoreticalCostWomc >= thresholds.foodCost.medium) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.foodCost.low,
                        item_foodcost: recipe.theoreticalCostWomc.toFixed(2)
                    }
                    await createAlert(tenantId, 'FoodCost_Item', 'High Foodcost', details, 'Medium');
                } else if (recipe.theoreticalCostWomc >= thresholds.foodCost.low) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.foodCost.low,
                        item_foodcost: recipe.theoreticalCostWomc.toFixed(2)
                    }
                    await createAlert(tenantId, 'FoodCost_Item', 'High Foodcost', details, 'Low');
                }
            }
            if (recipe.quantitySold !== 0) {
                if (recipe.theoreticalCostWmc <= thresholds.foodCost.critical) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.margin.low,
                        item_margin: recipe.theoreticalCostWmc.toFixed(2)
                    }
                    await createAlert(tenantId, 'Margin_Item', 'Low Margin', details, 'Critical');
                } else if (recipe.theoreticalCostWmc <= thresholds.foodCost.medium) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.margin.low,
                        item_margin: recipe.theoreticalCostWmc.toFixed(2)
                    }
                    await createAlert(tenantId, 'Margin_Item', 'Low Margin', details, 'Medium');
                } else if (recipe.theoreticalCostWmc <= thresholds.foodCost.low) {
                    details = {
                        item_name: recipe.name,
                        threshold: thresholds.margin.low,
                        item_margin: recipe.theoreticalCostWmc.toFixed(2)
                    }
                    await createAlert(tenantId, 'Margin_Item', 'Low Margin', details, 'Low');
                }
            }
        }
        for (const type of typesSalesData) {
            if (type.quantitySold !== 0) {
                if (type.theoreticalCostWomc > thresholds.foodCost.critical) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.foodCost.low,
                        type_foodcost: type.theoreticalCostWomc.toFixed(2)
                    }
                    await createAlert(tenantId, 'FoodCost_Type', 'High Foodcost', details, 'Critical');
                } else if (type.theoreticalCostWomc > thresholds.foodCost.medium) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.foodCost.low,
                        type_foodcost: type.theoreticalCostWomc.toFixed(2)
                    }
                    await createAlert(tenantId, 'FoodCost_Type', 'High Foodcost', details, 'Medium');
                } else if (type.theoreticalCostWomc > thresholds.foodCost.low) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.foodCost.low,
                        type_foodcost: type.theoreticalCostWomc.toFixed(2)
                    }
                    await createAlert(tenantId, 'FoodCost_Type', 'High Foodcost', details, 'Low');
                }
            }
            if (type.quantitySold !== 0) {
                if (type.theoreticalCostWmc < thresholds.foodCost.critical) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.margin.low,
                        type_margin: type.theoreticalCostWmc.toFixed(2)
                    }
                    await createAlert(tenantId, 'Margin_Type', 'Low Margin', details, 'Critical');
                } else if (type.theoreticalCostWmc < thresholds.foodCost.medium) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.margin.low,
                        type_margin: type.theoreticalCostWmc.toFixed(2)
                    }
                    await createAlert(tenantId, 'Margin_Type', 'Low Margin', details, 'Medium');
                } else if (type.theoreticalCostWmc < thresholds.foodCost.low) {
                    details = {
                        type_name: type.subType,
                        threshold: thresholds.margin.low,
                        type_margin: type.theoreticalCostWmc.toFixed(2)
                    }
                    await createAlert(tenantId, 'Margin_Type', 'Low Margin', details, 'Low');
                }
            }
        }

        // const foodCostRecipe = recipesSalesData.filter(recipe => {
        //     return (recipe.theoreticalCostWomc > 30);
        // });
        // const foodCostType = typesSalesData.filter(type => {
        //     return (type.theoreticalCostWomc > 30);
        // });
        // const marginRecipe = recipesSalesData.filter(recipe => {
        //     return (recipe.theoreticalCostWmc < 30);
        // });
        // const marginType = typesSalesData.filter(type => {
        //     return (type.theoreticalCostWmc < 30);
        // });
        // console.log('Food Cost Recipes:', foodCostRecipe);
        // console.log('Food Cost Types:', foodCostType);
        // console.log('Margin Recipes:', marginRecipe);
        // console.log('Margin Types:', marginType);
    } catch (error) {
        console.error('Error checking menu item for threshold:', error.message);
        throw error;
    }
}

