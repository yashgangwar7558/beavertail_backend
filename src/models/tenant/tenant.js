const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
});

const tenantSchema = new mongoose.Schema({
    tenantName: {
        type: String,
        required: true,
        unique: true,
    },
    tenantDescription: {
        type: String,
    },
    address: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    country: {
        type: String,
    },
    featureIds: [{
        type: String,
        default: [],
    }],
    invoiceEmails: [{
        type: String,
        default: [],
    }],
    billEmails: [{
        type: String,
        default: [],
    }],
    contact: contactSchema,
    userIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
    }],
    hasPosIntegrated: {
        type: Boolean,
        default: false
    }
})

const Tenant = new mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;