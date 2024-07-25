const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Role = require('../../models/user/role')

exports.createDefaultRoles = async (tenantId, session) => {
    try {
        const defaultRoles = [
            {
                tenantId,
                roleName: 'Admin',
                roleDescription: 'Full Access to portal',
                featureIds: [
                    '65db4f834179970e65c7fc6f', '65db5b8c4179970e65c7fc71', '65db5bb34179970e65c7fc73',
                    '65db5bf64179970e65c7fc89', '65db5c1e4179970e65c7fc9d', '65db5c464179970e65c7fcb2',
                    '65db5c8e4179970e65c7fcc5', '65db5cab4179970e65c7fccc', '65db5cca4179970e65c7fd0a',
                    '65db5d3a4179970e65c7fd48', '65db5d514179970e65c7fd4a', '65deef72b9fecf83a6d17f7f',
                    '65deefa0b9fecf83a6d17f81', '65deefcdb9fecf83a6d17f83', '65df048249e3147e2dcc2c23',
                    '66214f2108e4b2996a0e8950', '662aa458a2072e93a2ad9de2', '662aa4a6a2072e93a2ad9de4'
                ],
                roleTag: 'admin',
            },
            {
                tenantId,
                roleName: 'Business User',
                roleDescription: 'Limited Access to reports',
                featureIds: [
                    '65db4f834179970e65c7fc6f', '65db5b8c4179970e65c7fc71', '65db5bb34179970e65c7fc73',
                    '65db5c8e4179970e65c7fcc5', '65db5cca4179970e65c7fd0a', '65db5d3a4179970e65c7fd48',
                    '65db5d514179970e65c7fd4a', '65deef72b9fecf83a6d17f7f'
                ],
                roleTag: 'business-user',
            }
        ];

        await Role.insertMany(defaultRoles, { session });

        console.log('Default roles created successfully');
    } catch (err) {
        console.error('Error creating default tenant roles:', err.message);
        throw err; 
    }
}

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
}

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
