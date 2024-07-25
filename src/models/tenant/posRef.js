const mongoose = require('mongoose');

const posRefSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Tenant',
    },
    posId: {
        type: String,
        required: true,
    },
    posName: {
        type: String,
        required: true,
    },
    identifier: {
        type: String,
        required: true,
    },
    lastSynced: {
        type: Date,
        default: null
    }
})

const PosRef = new mongoose.model("PosRef", posRefSchema)

module.exports = PosRef
