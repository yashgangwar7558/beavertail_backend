const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Tenant = require('../../models/tenant/tenant');

exports.createTenant = async (req, res) => {
    try {
        const { tenantName, tenantDescription, featureIds, invoiceEmails, billEmails } = req.body

        if (!tenantName || !tenantDescription || !featureIds) {
            return res.json({
                success: false,
                message: 'Some required fields are missing!',
            });
        }

        const tenant = await Tenant.create({
            tenantName,
            tenantDescription,
            featureIds,
            invoiceEmails,
            billEmails,
        });

        res.json({ success: true, tenant });
    } catch (error) {
        console.error('Error creating tenant:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updateTenant = async (req, res) => {
    try {
        const { _id, tenantName, tenantDescription, featureIds, invoiceEmails, billEmails } = req.body;

        if (!_id || !tenantName || !tenantDescription || !featureIds) {
            return res.json({
                success: false,
                message: 'Some required fields are missing!',
            });
        }

        const updatedTenant = await Tenant.findByIdAndUpdate(
            _id,
            {
                $set: {
                    tenantName,
                    tenantDescription,
                    featureIds,
                    invoiceEmails,
                    billEmails,
                },
            },
            { new: true } 
        );

        if (!updatedTenant) {
            return res.json({
                success: false,
                message: 'Tenant not found or could not be updated!',
            });
        }

        res.json({ success: true, tenant: updatedTenant });
    } catch (error) {
        console.error('Error updating tenant:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


exports.getTenant = async (req, res) => {
    try {
        const { tenantId } = req.body;

        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.json({
                success: false,
                message: 'Tenant not found!',
            });
        }

        res.json({ success: true, tenant });
    } catch (error) {
        console.error('Error fetching tenant:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getAllTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find({});

        if (tenants.length == 0) {
            return res.json({
                success: false,
                message: 'No tenant found!',
            });
        }

        res.json({ success: true, tenants });
    } catch (error) {
        console.error('Error fetching tenant:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getTenantIds = async (req, res) => {
    try {
        const tenants = await Tenant.find({});

        if (tenants.length == 0) {
            return res.json({
                success: false,
                message: 'No tenant found!',
            });
        }

        const formattedTenants = tenants.map(tenant => ({
            label: tenant.tenantName,
            id: tenant._id,
        }));

        res.json({ success: true, tenants: formattedTenants });
    } catch (error) {
        console.error('Error fetching tenant:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};