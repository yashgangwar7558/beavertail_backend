const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
    featureName: {
        type: String,
        required: true,
        unique: true,
    },
    featureDescription: {
        type: String,
        required: true,
    },
    featureLink: {
        type: String,
        required: true,
    },
    featureTag: {
        type: String,
        unique: true,
        required: true
    }
});

const Feature = new mongoose.model("Feature", featureSchema);

module.exports = Feature;