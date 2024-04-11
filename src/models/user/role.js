const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    roleName: {
        type: String,
        required: true,
        unique: true,
    },
    roleDescription: {
        type: String,
        required: true,
    },
    featureIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feature',
        required: true,
    }],
    roleTag: {
        type: String,
        unique: true,
        required: true
    }
});

const Role = new mongoose.model("Role", roleSchema);

module.exports = Role;