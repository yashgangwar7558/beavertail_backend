const mongoose = require('mongoose');
const User = require('../models/user');
const Ingredient = require('../models/ingredients');
const Recipe = require('../models/recipeBook');
const Invoice = require('../models/invoice');
const unitMapping = require('../models/unitmapping');
const { createIngredientCostHistory } = require('../controllers/ingredientCostHistory');
const { createIngredient, updateIngredientCostInventory } = require('../controllers/ingredients');
const { createRecipeCostHistory } = require('../controllers/recipeCostHistory');
const { updateRecipesCostInventory } = require('../controllers/recipeBook');
const { createInvoice } = require('../controllers/invoice');
const { createIngredientPurchaseHistory } = require('../controllers/purchaseHistory');
const { uploadToS3, costEstimation, inventoryCheck, uploadToGCS } = require('../controllers/helper');

exports.processInvoice = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const { userId, invoiceId } = req.body;
            const invoice = await Invoice.findById(invoiceId);
            const AllIngredients = await Ingredient.find({ userId });
            const UnitMaps = await unitMapping.find({ userId });

            // Process 1 - Ingredients cost/inventory & ingredient cost history Update
            try {
                for (const ingredient of invoice.ingredients) {
                    const matchingIngredient = AllIngredients.find(
                        (allIngredient) => allIngredient.name === ingredient.name
                    );

                    if (matchingIngredient) {
                        const unitMap = UnitMaps.find(
                            (unitMap) => unitMap.ingredient_id.toString() === matchingIngredient._id.toString()
                        );

                        if (!unitMap) {
                            throw new Error(`Unit map not found for ingredient ${ingredient.name}, maybe its a new ingredient`);
                        }

                        const toUnit = unitMap ? unitMap.toUnit : ingredient.unit;
                        const convertedPrevQty = matchingIngredient.inventory * getConversionFactor(matchingIngredient.invUnit, toUnit, unitMap.fromUnit);
                        const convertedPrevAvgCost = matchingIngredient.avgCost / getConversionFactor(matchingIngredient.invUnit, toUnit, unitMap.fromUnit);
                        const convertedNewQty = ingredient.quantity * getConversionFactor(ingredient.unit, toUnit, unitMap.fromUnit);
                        const convertedNewCost = ingredient.unitPrice / getConversionFactor(ingredient.unit, toUnit, unitMap.fromUnit);

                        const newAvgCost = (((convertedPrevAvgCost * convertedPrevQty) + (convertedNewCost * convertedNewQty)) / (convertedPrevQty + convertedNewQty)) * getConversionFactor(matchingIngredient.invUnit, toUnit, unitMap.fromUnit);
                        const newInventoryQty = (convertedPrevQty + convertedNewQty) / getConversionFactor(matchingIngredient.invUnit, toUnit, unitMap.fromUnit);

                        const updateIngredient = await updateIngredientCostInventory(matchingIngredient._id, newAvgCost, newInventoryQty, session)
                        const ingCostHistory = await createIngredientCostHistory(userId, matchingIngredient._id, newAvgCost, matchingIngredient.invUnit, new Date(invoice.invoiceDate), session)

                    } else {
                        const newIngredient = await createIngredient(
                            userId,
                            ingredient.name,
                            ingredient.quantity,
                            ingredient.unit,
                            ingredient.unitPrice,
                            session
                        );

                        const ingCostHistory = await createIngredientCostHistory(userId, newIngredient._id, ingredient.unitPrice, ingredient.unit, new Date(invoice.invoiceDate), session)
                    }
                }
            } catch (error) {
                throw new Error(`Error in updating ingredient cost/inventory, ${error.message}`);
            }

            const AllUpdatedIngredients = await Ingredient.find({ userId });

            // Process 2 - Recipes cost/inventory & recipe cost history update
            try {
                const updatedIngredientsName = invoice.ingredients.map((item) => item.name)
                const query = {
                    userId,
                    'ingredients.name': { $in: updatedIngredientsName },
                }
                const recipesToUpdate = await Recipe.find(query);

                await Promise.all(recipesToUpdate.map(async (recipe) => {
                    const newInventory = await inventoryCheck(recipe.ingredients, AllIngredients, UnitMaps);
                    const newCost = await costEstimation(recipe.ingredients, AllIngredients, UnitMaps);

                    const updateRecipe = await updateRecipesCostInventory(userId, recipe._id, newInventory, newCost, session)
                    const recipeCostHistory = await createRecipeCostHistory(userId, recipe._id, newCost, new Date(invoice.invoiceDate), session)
                }));

            } catch (error) {
                throw new Error(`Error in updating recipe cost/inventory, ${error.message}`)
            }

            // Process 3 - Ingredient Purchase History Update
            try {
                for (const ingredient of invoice.ingredients) {
                    const matchingIngredient = AllUpdatedIngredients.find(
                        (allIngredient) => allIngredient.name === ingredient.name
                    );
                    const ingredientPurchaseHistory = await createIngredientPurchaseHistory(
                        userId,
                        matchingIngredient._id,
                        matchingIngredient.name,
                        invoiceId,
                        invoice.invoiceNumber,
                        ingredient.quantity,
                        ingredient.unit,
                        ingredient.unitPrice,
                        ingredient.total,
                        session,
                    )
                }
            } catch (error) {
                throw new Error(`Error in creating purchase history, ${error.message}`);
            }

            // Process 4 - Update invoice status to Processed-PendingPayment
            try {
                const updatedInvoice = await Invoice.findByIdAndUpdate(
                    invoiceId,
                    { $set: { status: { type: 'Processed-PendingPayment', remark: '' } } },
                    { new: true, session }
                );
            } catch (error) {
                throw new Error(`Error in updating invoice status, ${error.message}`);
            }

            await session.commitTransaction();
            return res.json({
                success: true,
                message: 'Invoice processed successfully!',
            });
        });
    } catch (error) {
        console.error('Error processing invoice:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        session.endSession();
    }
};

const getConversionFactor = (fromUnit, toUnit, fromUnitArray) => {
    const conversionObject = fromUnitArray.find((unit) => unit.unit === fromUnit);
    return conversionObject ? conversionObject.conversion : 1;
};