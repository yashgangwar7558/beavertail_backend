const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Tenant = require('../../models/tenant/tenant');
const Ingredient = require('../../models/ingredient/ingredients');

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

// inventory edit and updates will also update recipe inventory status and cost of recipe 
