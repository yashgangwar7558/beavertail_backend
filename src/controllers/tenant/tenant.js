const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Tenant = require('../../models/tenant/tenant');
const User = require('../../models/user/user');
const { createDefaultRoles } = require('../user/role')
const { getDb } = require('../../db/conn')

exports.createTenant = async (req, res) => {
    const session = await Tenant.startSession();
    session.startTransaction();
    try {
        const { tenantName, tenantDescription, address, country, state, city, invoiceEmails, billEmails, contact } = req.body;

        const tenant = await Tenant.create([{
            isActive: true,
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

exports.createShift4Tenant = async (req, res) => {
    const session = await Tenant.startSession();
    session.startTransaction();
    try {
        const { guid } = req.body

        const db = getDb();
        const CustomerDataCollection = await db.collection('customerdatas')
        const customerData = await CustomerDataCollection.findOne({ guid: guid });

        const tenant = await Tenant.create([{
            isActive: true,
            tenantName: customerData.restaurant.name,
            tenantDescription: customerData.restaurant.name,
            address: (customerData.restaurant.addressLine1 || '') + ' ' + (customerData.restaurant.addressLine2 || ''),
            city: customerData.restaurant.city,
            state: customerData.restaurant.state,
            country: customerData.restaurant.zip,
            invoiceEmails: [customerData.restaurant.email],
            billEmails: [customerData.restaurant.email],
            contact: customerData.contact
        }], { session });

        await createDefaultRoles(tenant[0]._id, session);

        await exports.createDefaultUser(customerData, tenant[0]._id, session)

        const SubscriptionStatusesCollection = await db.collection('subscriptionstatuses');
        await SubscriptionStatusesCollection.updateOne(
            { guid: guid },
            { $set: { status: 'Installed', tenantId: tenant[0]._id, updatedAt: new Date() } }
        );

        await session.commitTransaction();
        session.endSession();

        res.json({ success: true, tenant: tenant[0], message: 'Shift4 tenant created successfully' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating tenant:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.createDefaultUser = async (customerData, tenantId, session) => {
    try {

        const restaurantName = customerData.restaurant.name.split(' ')[0]; 
        const capitalizedRestaurantName = restaurantName.charAt(0).toUpperCase() + restaurantName.slice(1);
        const randomNumber = Math.floor(10000 + Math.random() * 90000);
        const username = `${capitalizedRestaurantName}${randomNumber}`;
        const password = `${capitalizedRestaurantName}@${randomNumber}`;

        const isNewUser1 = await User.isThisEmailInUse(customerData.contact.email)
        const isNewUser2 = await User.isThisMobileNoInUse(customerData.contact.phone)
        const isNewUser3 = await User.isThisUsernameInUse(username)

        if (!isNewUser1) {
            return res.json({
                success: false,
                message: 'This Email is already in use!',
            });
        } else if (!isNewUser2) {
            return res.json({
                success: false,
                message: 'This Mobile number is already in use!',
            });
        } else if (!isNewUser3) {
            return res.json({
                success: false,
                message: 'This Username is already in use!',
            });
        }

        const user = await User({
            username,
            password,
            firstName: customerData.contact.firstName,
            lastName: customerData.contact.lastName,
            email: customerData.contact.email,
            mobileNo: customerData.contact.phone,
            address: (customerData.restaurant.addressLine1 || '') + ' ' + (customerData.restaurant.addressLine2 || ''),
            roles: [],
            tenantId,
            status: 'pending_superadmin_approval'
        });

        await user.save({ session });
    } catch (err) {
        console.error('Error creating user:', err.message);
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

        res.json({ success: true, message: 'Tenant updated successfully' });
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

exports.getActiveTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find({ isActive: true });

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

exports.getActiveTenantIds = async (req, res) => {
    try {
        const tenants = await Tenant.find({ isActive: true });

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

exports.markTenantInactive = async (req, res) => {
    try {
        const { tenantId } = req.body;

        const updatedTenant = await Tenant.findByIdAndUpdate(
            tenantId,
            {
                $set: {
                    isActive: false
                },
            },
            { new: true }
        );

        const db = getDb();
        const SubscriptionStatusesCollection = await db.collection('subscriptionstatuses');
        await SubscriptionStatusesCollection.updateOne(
            { tenantId: new mongoose.Types.ObjectId(tenantId) },
            { $set: { status: 'Uninstalled', updatedAt: new Date() } }
        );

        res.json({ success: true, message: 'Tenant marked inActive!' });
    } catch (error) {
        console.error('Error marking tenant inactive:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

