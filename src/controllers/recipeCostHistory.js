const mongoose = require('mongoose');
const recipeCostHistory = require('../models/recipeCostHistory');

exports.createRecipeCostHistory = async (userId, recipeId, cost, date) => {
    try {
        const result = await recipeCostHistory.create({
            userId,
            recipeId,
            cost,
            date
        })
        return result
    } catch (err) {
        console.log('Error creating recipe cost history:', err.message);
        throw err
    }
}

exports.findAverageCostForRecipeInDateRange = async (recipeId, startDate, endDate) => {
    try {
        const pipeline = [];

        if (startDate && endDate) {
            pipeline.push({
                $match: {
                    recipeId: new mongoose.Types.ObjectId(recipeId),
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                },
            });
        } else {
            pipeline.push({
                $match: {
                    recipeId: new mongoose.Types.ObjectId(recipeId),
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                averageCost: { $avg: '$cost' },
            },
        });

        const result = await recipeCostHistory.aggregate(pipeline);

        if (result.length > 0) {
            return result[0].averageCost;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error finding average cost:', error.message);
        throw error;
    }
};