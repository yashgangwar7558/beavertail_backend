const mongoose = require('mongoose');
const User = require('../models/user');
const Ingredient = require('../models/ingredients');
const unitMapping = require('../models/unitmapping');
const { createIngredientCostHistory } = require('../controllers/ingredientCostHistory');
const { createInvoice } = require('../controllers/invoice');
const { createIngredientPurchaseHistory } = require('../controllers/purchaseHistory');
const { createIngredient, updateIngredientCostInventory } = require('../controllers/ingredients');
const { uploadToS3 } = require('../controllers/helper');

exports.processInvoice = async (req, res) => {
    try {
        const { userId } = req.body;
        const invoiceNumber = "INV-958";
        const vendor = "Walmart";
        const invoiceDate = "2024-02-01";
        const ingredients = [
            { name: "Salt", quantity: 2, unit: "kg", unitPrice: 150, total: "300" },
            { name: "Chicken", quantity: 2, unit: "lbs", unitPrice: 450, total: "900" },
            { name: "Onions", quantity: 3, unit: "kg", unitPrice: 50, total: "150" },
        ];
        const payment = "Bill Pay";
        const status = "Pending";
        const total = "860";

        const AllIngredients = await Ingredient.find({ userId });
        const UnitMaps = await unitMapping.find({ userId });

        if (req.files && req.files.length > 0) {
            const processingPromises = req.files.map(async (file) => {

                // Process - 1 (Uploading to S3, creating new invoice)
                const { buffer } = file;
                const fileName = `${invoiceNumber}_${Date.now()}`;
                const fileType = file.mimetype
                const bucketName = 'beavertail-7558';
                const folderPath = 'invoices'
                const invoiceUrl = await uploadToS3(buffer, fileName, fileType, bucketName, folderPath);
                const createdInvoice = await createInvoice(
                    userId,
                    invoiceNumber,
                    vendor,
                    invoiceDate,
                    ingredients,
                    payment,
                    status,
                    total,
                    invoiceUrl,
                )

                // Process 2 - Ingredients cost/inventory Update
                for (const ingredient of ingredients) {
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

                        const updateIngredient = await updateIngredientCostInventory(matchingIngredient._id, newAvgCost, newInventoryQty)
                        const costHistory = await createIngredientCostHistory(userId, matchingIngredient._id, newAvgCost, matchingIngredient.invUnit, new Date(invoiceDate))

                    } else {
                        const newIngredient = await createIngredient(
                            userId,
                            ingredient.name,
                            ingredient.quantity,
                            ingredient.unit,
                            ingredient.unitPrice,
                        );

                        const costHistory = await createIngredientCostHistory(userId, newIngredient._id, ingredient.unitPrice, ingredient.unit, new Date(invoiceDate))
                    }
                }


                // Process 3 - Ingredient Purchase History Update
                const AllUpdatedIngredients = await Ingredient.find({ userId });
                for (const ingredient of ingredients) {
                    const matchingIngredient = AllUpdatedIngredients.find(
                        (allIngredient) => allIngredient.name === ingredient.name
                    );
                    const ingredientPurchaseHistory = await createIngredientPurchaseHistory(
                        userId,
                        matchingIngredient._id,
                        matchingIngredient.name,
                        createdInvoice._id,
                        invoiceNumber,
                        ingredient.quantity,
                        ingredient.unit,
                        ingredient.unitPrice,
                        ingredient.total
                    )
                }

                return { success: true };
            });

            const results = await Promise.all(processingPromises);
            const allSuccess = results.every((result) => result.success);

            if (allSuccess) {
                return res.json({
                    success: true,
                    message: 'Invoices processed successfully!',
                });
            } else {
                return res.json({
                    success: false,
                    message: 'Some files failed to process.',
                });
            }
        } else {
            return res.json({
                success: false,
                message: 'Invoice files not received!',
            });
        }
    } catch (error) {
        console.error('Error processing invoice:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const getConversionFactor = (fromUnit, toUnit, fromUnitArray) => {
    const conversionObject = fromUnitArray.find((unit) => unit.unit === fromUnit);
    return conversionObject ? conversionObject.conversion : 1;
};