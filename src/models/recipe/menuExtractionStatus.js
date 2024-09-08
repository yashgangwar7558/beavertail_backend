const mongoose = require('mongoose');

    const extractionSchema = new mongoose.Schema({
        tenantId: String,
        tenantName: String,
        fileUrl: String,
        fileType: String,
        status: String, // e.g., 'started', 'in_progress', 'completed', 'failed'
        subStatus: String,
        processId: String,
        startedAt: { type: Date, default: Date.now },
        completedAt: Date,
        error: String // store the error if any
    }, { timestamps: true });

const menuExtractionStatus = mongoose.model('menuExtractionStatus', extractionSchema);
module.exports = menuExtractionStatus;