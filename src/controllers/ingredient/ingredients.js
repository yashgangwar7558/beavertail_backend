const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Ingredient = require('../../models/ingredient/ingredients');

exports.createIngredient = async (userId, name, inventory, invUnit, avgCost, session, category, note, shelfLife, slUnit) => {
    try {
        if (!userId || !name || !inventory || !invUnit || !avgCost) {
            throw new Error('Some fields are missing or invalid!');
        }
        const result = await Ingredient.create([{
            userId,
            name,
            category,
            inventory,
            invUnit,
            avgCost,
            note,
            shelfLife,
            slUnit,
        }], {session});
        return result[0]
    } catch (error) {
        console.error('Error creating ingredient:', error.message);
        throw error;
    }
};

exports.updateIngredientCostInventory = async (ingredientId, newAvgCost, newInventoryQty, session) => {
    try {
        const updateIngredient = await Ingredient.findById(ingredientId);
        updateIngredient.avgCost = newAvgCost;
        updateIngredient.inventory = newInventoryQty;
        const result = await updateIngredient.save({session});
        return result;
    } catch (error) {
        console.error('Error updating ingredient avgcost and inventory:', error.message);
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
        const { userId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User not found!',
            });
        }

        // Find all ingredients with the specified user ID
        const ingredients = await Ingredient.find({ userId: user._id });

        res.json({ success: true, ingredients });
    } catch (error) {
        console.error('Error fetching ingredients:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// inventory edit and updates will also update recipe inventory status and cost of recipe 
