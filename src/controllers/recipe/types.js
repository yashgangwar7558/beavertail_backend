const mongoose = require('mongoose');
const Types = require('../../models/recipe/types');
const User = require('../../models/user/user');
const setTypesModel = require('../../middlewares/dynamicSchema/setTypesModel');

exports.createRecipeType = async (req, res) => {
    try {
        // const { Types } = req;
        const { tenantId, type, subType, imageUrl } = req.body

        const result = await Types.create({
            tenantId,
            type,
            subType,
            imageUrl
        })
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error creating recipe type:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.storeExtractedCategories = async (tenantId, categoriesJson, session) => {
    try {
        if (!Array.isArray(categoriesJson)) {
            throw new Error('categoriesJson must be an array');
        }

        for (const category of categoriesJson) {
            await Types.create({
                tenantId,
                type: category.type,
                subType: category.subType,
                imageUrl: 'https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D'
            });
        }

        return true;
    } catch (error) {
        console.error('Error storing extracted categories:', error.message);
        throw error;
    }
}

exports.getAllTypes = async (tenantId) => {
    try {
        const types = await Types.find({ tenantId });

        const sortedTypes = types.sort((a, b) => a.type.localeCompare(b.type));

        return sortedTypes;
    } catch (error) {
        console.error('Error fetching recipe types:', error.message);
        throw error;
    }
}

exports.getAllSubTypesOfTypes = async (tenantId, type) => {
    try {
        const subTypes = await Types.find({ tenantId: tenantId, type: type });

        const sortedSubTypes = subTypes.sort((a, b) => a.subType.localeCompare(b.subType));

        return sortedSubTypes;
    } catch (error) {
        console.error('Error fetching recipe sub types:', error.message);
        throw error;
    }
}

exports.getAllSubTypes = async (tenantId) => {
    try {
        const subTypes = await Types.find({ tenantId: tenantId});

        const sortedSubTypes = subTypes.sort((a, b) => a.subType.localeCompare(b.subType));

        return sortedSubTypes;
    } catch (error) {
        console.error('Error fetching recipe sub types:', error.message);
        throw error;
    }
}