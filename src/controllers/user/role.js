const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Role = require('../../models/user/role')

exports.createRole = async (req, res) => {
    try {
        const {roleName, roleDescription, featureIds, roleTag} = req.body

        if (!roleName || !roleDescription || !featureIds || !roleTag) {
            return res.json({
                success: false,
                message: 'Some required fields are missing!',
            });
        }

        const role = await Role.create({
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
        const { roleId } = req.body;

        const role = await Role.findById(roleId);

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

exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find({});

        if (roles.length == 0) {
            return res.json({
                success: false,
                message: 'No roles found!',
            });
        }

        res.json({ success: true, roles });
    } catch (error) {
        console.error('Error fetching roles:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}