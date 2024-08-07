const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Tenant = require('../../models/tenant/tenant');
const { createDefaultRoles } = require('../user/role')

exports.createTenant = async (req, res) => {
    const session = await Tenant.startSession();
    session.startTransaction();
    try {
        const { tenantName, tenantDescription, address, country, state, city, invoiceEmails, billEmails, contact } = req.body;

        const tenant = await Tenant.create([{
            tenantName,
            tenantDescription,
            address,
            city,
            state,
            country,
            invoiceEmails,
            billEmails,
            contact
        }], { session });

        await createDefaultRoles(tenant[0]._id, session);

        await session.commitTransaction();
        session.endSession();

        res.json({ success: true, tenant: tenant[0], message: 'Tenant created successfully' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating tenant:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.updateTenant = async (req, res) => {
    try {
        const { _id, tenantName, tenantDescription, featureIds, invoiceEmails, billEmails } = req.body;

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

        res.json({ success: true, message: 'Tenant updated successfully'});
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