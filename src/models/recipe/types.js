const mongoose = require('mongoose');

const createTypesModel = (userId) => {
    const collectionName = `types_${userId}`;

    if (mongoose.connection.models[collectionName]) {
        return mongoose.connection.models[collectionName];
    }

    const recipeTypesSchema = new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        type: { type: String },
        imageUrl: { type: String }
    });

    return mongoose.model(collectionName, recipeTypesSchema);
};

module.exports = createTypesModel;
