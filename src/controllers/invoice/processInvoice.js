const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Tenant = require('../../models/tenant/tenant');
const Ingredient = require('../../models/ingredient/ingredients');
const Recipe = require('../../models/recipe/recipeBook');
const Invoice = require('../../models/invoice/invoice');
const unitMapping = require('../../models/ingredient/unitmapping');
const { createIngredientCostHistory } = require('../ingredient/ingredientCostHistory');
const { createIngredient, updateIngredientPricesInventory } = require('../ingredient/ingredients');
const { createRecipeCostHistory } = require('../recipe/recipeCostHistory');
const { updateRecipesCostInventory } = require('../recipe/recipeBook');
const { createIngredientPurchaseHistory } = require('../invoice/purchaseHistory');
const { uploadToS3, costEstimation, inventoryCheck, uploadToGCS } = require('../helper');
const { checkRecipesThreshold } = require('../recipe/recipeBook');
const { getIngredientMedianPurchasePrice } = require('../invoice/purchaseHistory');

exports.processInvoice = async (req, res) => {
    const session = await mongoose.startSession();

    return new Promise((resolve, reject) => {
        try {
            session.withTransaction(async () => {
                const { tenantId, invoiceId } = req.body;
                const invoice = await Invoice.findById(invoiceId);
                const AllIngredients = await Ingredient.find({ tenantId });
                const UnitMaps = await unitMapping.find({ tenantId });

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
                            const newLastPurchasePrice = convertedNewCost * getConversionFactor(matchingIngredient.invUnit, toUnit, unitMap.fromUnit)
                            let newMedianPurchasePrice = await getIngredientMedianPurchasePrice(tenantId, matchingIngredient, ingredient, unitMap);
                            newMedianPurchasePrice = newMedianPurchasePrice === 0 ? newLastPurchasePrice : newMedianPurchasePrice;

                            const updateIngredient = await updateIngredientPricesInventory(matchingIngredient._id, newAvgCost, newInventoryQty, newLastPurchasePrice, newMedianPurchasePrice, session)
                            const ingCostHistory = await createIngredientCostHistory(tenantId, matchingIngredient._id, newAvgCost, matchingIngredient.invUnit, new Date(invoice.invoiceDate), session)

                        } else {
                            const newIngredient = await createIngredient(
                                tenantId,
                                ingredient.name,
                                ingredient.quantity,
                                ingredient.unit,
                                ingredient.unitPrice,
                                session
                            );

                            const ingCostHistory = await createIngredientCostHistory(tenantId, newIngredient._id, ingredient.unitPrice, ingredient.unit, new Date(invoice.invoiceDate), session)
                        }
                    }
                } catch (error) {
                    throw new Error(`Error in updating ingredient avgcost/inventory/purchaseprice:, ${error.message}`);
                }

                // Process 2 - Recipes cost/inventory & recipe cost history update
                try {
                    const updatedIngredientsName = invoice.ingredients.map((item) => item.name)
                    const query = {
                        tenantId,
                        'ingredients.name': { $in: updatedIngredientsName },
                    }
                    const recipesToUpdate = await Recipe.find(query);

                    await Promise.all(recipesToUpdate.map(async (recipe) => {
                        const newInventory = await inventoryCheck(recipe.ingredients, AllIngredients, UnitMaps);
                        const newCost = await costEstimation(recipe.ingredients, AllIngredients, UnitMaps);

                        const updateRecipe = await updateRecipesCostInventory(tenantId, recipe._id, newInventory, newCost, session)
                        const recipeCostHistory = await createRecipeCostHistory(tenantId, recipe._id, newCost, new Date(invoice.invoiceDate), session)
                    }));

                } catch (error) {
                    throw new Error(`Error in updating recipe cost/inventory, ${error.message}`)
                }

                // Process 3 - Update invoice status to Processed-PendingPayment
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

                // Process 4 - Ingredient Purchase History Update
                try {
                    const AllUpdatedIngredients = await Ingredient.find({ tenantId });
                    for (const ingredient of invoice.ingredients) {
                        const matchingIngredient = AllUpdatedIngredients.find(
                            (allIngredient) => allIngredient.name === ingredient.name
                        );
                        const ingredientPurchaseHistory = await createIngredientPurchaseHistory(
                            tenantId,
                            matchingIngredient._id,
                            matchingIngredient.name,
                            invoiceId,
                            invoice.invoiceNumber,
                            ingredient.quantity,
                            ingredient.unit,
                            ingredient.unitPrice,
                            ingredient.total,
                        )
                    }
                } catch (error) {
                    throw new Error(`Error in creating purchase history, ${error.message}`);
                }

                resolve({ success: true, message: 'Invoice processed successfully!', tenantId })
            });
        } catch (error) {
            reject(error);
        }
    })
        .then((result) => {
            res.json(result);
            const { tenantId } = result;
            checkRecipesThreshold(tenantId);
        })
        .catch((error) => {
            console.error('Error processing invoice:', error.message);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        });
};

const getConversionFactor = (fromUnit, toUnit, fromUnitArray) => {
    const conversionObject = fromUnitArray.find((unit) => unit.unit === fromUnit);
    return conversionObject ? conversionObject.conversion : 1;
};