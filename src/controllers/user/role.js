const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Role = require('../../models/user/role')

exports.createRole = async (req, res) => {
    try {
        const { tenantId, roleName, roleDescription, featureIds, roleTag } = req.body

        if (!tenantId || !roleName || !roleDescription || !featureIds || !roleTag) {
            return res.json({
                success: false,
                message: 'Some required fields are missing!',
            });
        }

        const existingRole = await Role.findOne({ tenantId, roleName });
        if (existingRole) {
            return res.json({
                success: false,
                message: `Role with name '${roleName}' already exists for this tenant!`,
            });
        }

        const role = await Role.create({
            tenantId,
            roleName,
            roleDescription,
            featureIds,
            roleTag,
        });

        res.json({ success: true, role });
    } catch (error) {
        console.error('Error defining role:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getRole = async (req, res) => {
    try {
        const { tenantId, roleName } = req.body;

        const role = await Role.find({ tenantId: tenantId, roleName: roleName });

        if (!role) {
            return res.json({
                success: false,
                message: 'Role not found!',
            });
        }

        res.json({ success: true, role });
    } catch (error) {
        console.error('Error fetching role:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getTenantRoles = async (req, res) => {
    try {

        const { tenantId } = req.body

        const roles = await Role.find({ tenantId: tenantId });

        if (roles.length == 0) {
            return res.json({
                success: false,
                message: 'No roles found for this tenant!',
            });
        }

        res.json({ success: true, roles });
    } catch (error) {
        console.error('Error fetching roles:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}