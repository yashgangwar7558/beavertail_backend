const PosRef = require('../../models/tenant/posRef');
const Tenant = require('../../models/tenant/tenant');

exports.createPosRef = async (req, res) => {
    try {
        const { posName, posId, identifier, tenantId } = req.body
        if (!posName || !posId || !identifier || !tenantId) {
            return res.json({ success: false, message: 'Some fields are missing' });
        }
        const posRef = await PosRef.create({
            tenantId,
            posId,
            posName,
            identifier
        })

        const tenant = await Tenant.findById(tenantId);
        tenant.hasPosIntegrated = true;
        await tenant.save();

        res.status(201).json({ success: true, message: 'PosRef for tenant created successfully' });
    } catch (error) {
        console.error('Error creating PosRef:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getTenantsByPosId = async (req, res) => {
    try {
        const { posId } = req.body;
        const posRefs = await PosRef.find({ posId });
        res.status(200).json({ success: true, posRefs });
    } catch (error) {
        console.error('Error fetching PosRefs by posId:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getLastSynced = async (req, res) => {
    try {
        const { tenantId, posId } = req.body;
        const posRef = await PosRef.findOne({ tenantId, posId });
        res.status(200).json({ success: true, lastSynced: posRef.lastSynced });
    } catch (error) {
        console.error('Error fetching PosRefs by posId:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.updateLastSynced = async (req, res) => {
    try {
        const { tenantId, posId, lastSynced } = req.body;
        const posRef = await PosRef.findOneAndUpdate(
            { tenantId, posId },
            { lastSynced },
            { new: true }
        );
        if (!posRef) {
            return res.status(404).json({ success: false, message: 'PosRef not found' });
        }
        res.status(200).json({ success: true, lastSynced });
    } catch (error) {
        console.error('Error updating lastSynced:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
