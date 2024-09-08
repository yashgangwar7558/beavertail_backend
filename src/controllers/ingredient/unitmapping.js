const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Tenant = require('../../models/tenant/tenant');
const unitMapping = require('../../models/ingredient/unitmapping');
const Ingredient = require('../../models/ingredient/ingredients');

exports.createUnitMap = async (req, res) => {
    try {
        const {tenantId, ingredient_id, name, fromUnit, toUnit, description} = req.body;
        if(!tenantId || !ingredient_id || !name || !fromUnit || !toUnit || !description) {
            return res.json({
                success: false,
                message: 'Some fields are missing!',
            });
        }
        const unitMap = await unitMapping.create({
            tenantId,
            ingredient_id,
            name,
            fromUnit,
            toUnit,
            description
        });

        res.json({ success: true, unitMap });
    } catch (err) {
        console.error('Error creating unitMap:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.storeExtractedUnitmapping = async (tenantId, unitMappingJson, session) => {
    try {
        if (!tenantId || !Array.isArray(unitMappingJson)) {
            throw new Error('Missing tenantId or unitMappingJson is not valid!');
        }

        const ingredients = await Ingredient.find({ tenantId }).session(session);
        const ingredientIdMap = ingredients.reduce((acc, ingredient) => {
            acc[ingredient.name] = ingredient._id;
            return acc;
        }, {});

        for (const unitMap of unitMappingJson) {
            const { name, fromUnit, toUnit, description } = unitMap;
            const ingredient_id = ingredientIdMap[name];

            if (!ingredient_id) {
                throw new Error(`Ingredient with name ${name} not found`);
            }

            await unitMapping.create({
                tenantId,
                ingredient_id,
                name,
                fromUnit,
                toUnit,
                description
            });
        }

        return true;
    } catch (error) {
        console.error('Error storing extracted unitMapping:', error.message);
        throw error;
    }
}

exports.getUnitMap = async (req, res) => {
    try {
        const { ingredient_id } = req.body;

        // Find an ingredient by ID
        const unitMap = await unitMapping.findOne({ingredient_id});

        if (!unitMap) {
            return res.json({
                success: false,
                message: 'unitMap not found!',
            });
        }

        res.json({ success: true, unitMap });
    } catch (error) {
        console.error('Error fetching unitMap:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getAllUnitMaps = async (req, res) => {
    try {
        const { tenantId } = req.body;

        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.json({
                success: false,
                message: 'Tenant not found!',
            });
        }

        const unitMaps = await unitMapping.find({ tenantId: tenant._id });

        res.json({ success: true, unitMaps });
    } catch (error) {
        console.error('Error fetching unitMaps:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};