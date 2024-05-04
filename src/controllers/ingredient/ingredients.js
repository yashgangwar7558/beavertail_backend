const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Tenant = require('../../models/tenant/tenant');
const Ingredient = require('../../models/ingredient/ingredients');
const unitMapping = require('../../models/ingredient/unitmapping')
const { Alert } = require('../../models/alert/alert')
const { getConversionFactor } = require('../helper')
const { createAlert } = require('../../controllers/alert/alert')
const { log } = require('console');

exports.createIngredient = async (tenantId, name, inventory, invUnit, avgCost, session, category, note, shelfLife, slUnit) => {
    try {
        if (!tenantId || !name || !inventory || !invUnit || !avgCost) {
            throw new Error('Some fields are missing or invalid!');
        }
        const result = await Ingredient.create([{
            tenantId,
            name,
            category,
            inventory,
            invUnit,
            avgCost,
            lastPurchasePrice: avgCost,
            medianPurchasePrice: avgCost,
            note,
            shelfLife,
            slUnit,
        }], { session });
        return result[0]
    } catch (error) {
        console.error('Error creating ingredient:', error.message);
        throw error;
    }
};

exports.updateIngredientPricesInventory = async (ingredientId, newAvgCost, newInventoryQty, newLastPurchasePrice, newMedianPurchasePrice, session) => {
    try {
        const updateIngredient = await Ingredient.findById(ingredientId);
        updateIngredient.avgCost = newAvgCost;
        updateIngredient.inventory = newInventoryQty;
        updateIngredient.lastPurchasePrice = newLastPurchasePrice;
        updateIngredient.medianPurchasePrice = newMedianPurchasePrice;
        const result = await updateIngredient.save({ session });
        return result;
    } catch (error) {
        console.error('Error updating ingredient avgcost/inventory/purchaseprice:', error.message);
        throw error;
    }
}

exports.updateIngredientThreshold = async (req, res) => {
    try {
        const { ingredientId, newThreshold } = req.body
        const updateIngredient = await Ingredient.findById(ingredientId);
        updateIngredient.threshold = newThreshold;
        const result = await updateIngredient.save();
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error updating ingredient threshold:', error.message);
        throw error;
    }
}

exports.getIngredient = async (req, res) => {
    try {
        const { ingredientId } = req.body;

        // Find an ingredient by ID
        const ingredient = await Ingredient.findById(ingredientId);

        if (!ingredient) {
            return res.json({
                success: false,
                message: 'Ingredient not found!',
            });
        }

        res.json({ success: true, ingredient });
    } catch (error) {
        console.error('Error fetching ingredient:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getAllIngredient = async (req, res) => {
    try {
        const { tenantId } = req.body;

        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.json({
                success: false,
                message: 'Tenant not found!',
            });
        }

        // Find all ingredients with the specified tenant ID
        const ingredients = await Ingredient.find({ tenantId: tenant._id });

        res.json({ success: true, ingredients });
    } catch (error) {
        console.error('Error fetching ingredients:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


exports.checkIngredientsThreshold = async (tenantId, purchasedIngredients, vendor, invoiceId) => {
    try {
        const ingredients = await Ingredient.find({ tenantId: tenantId });
        // const ingredientsExceedingThreshold = [];

        for (const purchaseIngredient of purchasedIngredients) {
            const ingredient = ingredients.find(item => item.name === purchaseIngredient.name);

            if (ingredient && ingredient.threshold !== 0) {

                const unitMap = await unitMapping.findOne({ ingredient_id: ingredient._id });

                if (!unitMap) {
                    throw new Error(`Unit map not found for ingredient ${ingredient.name}, maybe its a new ingredient`);
                }
                const convertedNewPurchasePrice = purchaseIngredient.unitPrice / getConversionFactor(purchaseIngredient.unit, unitMap.toUnit, unitMap.fromUnit)
                const convertedLastMedianPrice = ingredient.medianPurchasePrice / getConversionFactor(ingredient.invUnit, unitMap.toUnit, unitMap.fromUnit)
                const newPurchasePrice = convertedNewPurchasePrice * getConversionFactor(ingredient.invUnit, unitMap.toUnit, unitMap.fromUnit)
                const priceDifference = convertedNewPurchasePrice - convertedLastMedianPrice
                const priceDifferencePercent = (priceDifference / convertedLastMedianPrice) * 100
                const thresholdAmount = convertedLastMedianPrice * (ingredient.threshold / 100);

                const existingAlert = await Alert.findOne({ tenantId, 'details.invoice_id': invoiceId, 'details.ingredient_name': ingredient.name, active: true })

                if (priceDifference > thresholdAmount) {
                    let severity = 'Low';
                    const thresholdDifference = priceDifferencePercent - ingredient.threshold;
                    if (thresholdDifference >= 10) {
                        severity = 'Critical';
                    } else if (thresholdDifference >= 5) {
                        severity = 'Medium';
                    }

                    const details = {
                        ingredient_name: ingredient.name,
                        invoice_id: invoiceId,
                        vendor_name: vendor,
                        median_price: ingredient.medianPurchasePrice.toFixed(2),
                        new_price: newPurchasePrice.toFixed(2),
                        threshold: ingredient.threshold,
                        percent_change: priceDifferencePercent.toFixed(2),
                    }

                    if (existingAlert) {
                        await Alert.findByIdAndDelete(existingAlert._id);
                        await createAlert(tenantId, 'Price_Ingredient', 'Price Hike', details, severity)
                    } else {
                        await createAlert(tenantId, 'Price_Ingredient', 'Price Hike', details, severity);
                    }
                } else {
                    if (existingAlert) {
                        await Alert.findByIdAndUpdate(existingAlert._id, { $set: { active: false } });
                    }
                }
            }
        }

        // console.log(ingredientsExceedingThreshold);
    } catch (error) {
        console.error('Error checking ingredient for threshold:', error.message);
        throw error;
    }
}
