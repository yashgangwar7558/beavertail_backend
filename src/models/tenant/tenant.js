const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    tenantName: {
        type: String,
        required: true,
        unique: true,
    },
    tenantDescription: {
        type: String,
        required: true,
    },
    featureIds: [{
        type: String,
        required: true,
    }],
    invoiceEmails: [{
        type: String,
        default: [],
    }],
    billEmails: [{
        type: String,
        default: [],
    }],
    userIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
    }],
});

const Tenant = new mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;