const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    roleName: {
        type: String,
        required: true,
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
        required: true
    }
});

const Role = new mongoose.model("Role", roleSchema);

module.exports = Role;