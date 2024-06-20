const mongoose = require('mongoose');

// const createTypesModel = (userId) => {
//     const collectionName = `types_${userId}`;

//     if (mongoose.connection.models[collectionName]) {
//         return mongoose.connection.models[collectionName];
//     }

//     const recipeTypesSchema = new mongoose.Schema({
//         tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
//         type: { type: String },
//         imageUrl: { type: String }
//     });

//     return mongoose.model(collectionName, recipeTypesSchema);
// };

// module.exports = createTypesModel;

const recipeTypesSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    type: { type: String, required: true },
    subType: { type: String, required: true },
    imageUrl: { type: String }
});

recipeTypesSchema.index({ tenantId: 1 })
recipeTypesSchema.index({ tenantId: 1, type: 1 });
const Types = mongoose.model('Types', recipeTypesSchema);

module.exports = Types;
