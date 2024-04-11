const mongoose = require('mongoose');
const modifierCostHistory = require('../../models/recipe/modifierCostHistory');

exports.createModifierCostHistory = async (tenantId, recipeId, cost, date) => {
    try {
        const result = await modifierCostHistory.create({
            tenantId,
            recipeId,
            cost,
            date: date.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
        })
        return result
    } catch (err) {
        console.log('Error creating modifier cost history:', err.message);
        throw err
    }
}

exports.findAverageModifierCostForRecipeInDateRange = async (recipeId, startDate, endDate) => {
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

            pipeline.push({
                $count: 'documentCount',
            });

            const countResult = await modifierCostHistory.aggregate(pipeline);

            if (countResult.length === 0 || countResult[0].documentCount === 0) {
                pipeline.pop();
                pipeline.pop();
                pipeline.push({
                    $match: {
                        recipeId: new mongoose.Types.ObjectId(recipeId),
                        date: {
                            $lte: new Date(endDate),
                        },
                    },
                });
            } else {
                pipeline.pop();
            }
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

        const result = await modifierCostHistory.aggregate(pipeline);

        if (result.length > 0) {
            return result[0].averageCost;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error finding average modifier cost:', error.message);
        throw error;
    }
};