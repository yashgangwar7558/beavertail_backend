const jwt = require('jsonwebtoken');
const User = require('../../models/user/user');
const Feature = require('../../models/user/feature');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

exports.createUser = async (req, res) => {
    try {
        const { username, password, firstName, lastName, email, mobileNo, address, rolesAssigned, tenantId, status } = req.body
        const isNewUser1 = await User.isThisEmailInUse(email)
        const isNewUser2 = await User.isThisMobileNoInUse(mobileNo)
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

        const formattedRoles = rolesAssigned.map(role => ({
            roleName: role.roleName,
            roleId: role._id,
        })) || [];

        const user = await User({
            username,
            password,
            firstName,
            lastName,
            email,
            mobileNo,
            address,
            roles: formattedRoles,
            tenantId,
            status
        });
        await user.save();
        res.json({ success: true, user });
    } catch (err) {
        console.error('Error creating user:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.userSignIn = async (req, res) => {
    try {
        const { username, password } = req.body
        const user = await User.findOne({ username });

        if (!user)
            return res.json({
                success: false,
                message: 'No user exists, with the given username!',
            });

        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            return res.json({
                success: false,
                message: 'username / password does not match!',
            });

        switch (user.status) {
            case 'approved':
                const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
                    expiresIn: '1d',
                });

                let oldTokens = user.tokens || [];

                if (oldTokens.length) {
                    oldTokens = oldTokens.filter(t => (Date.now() - parseInt(t.signedAt)) / 1000 < 86400); // 86400
                }

                await User.findByIdAndUpdate(user._id, {
                    tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
                });

                const { userAllowedRoutes } = await exports.userAllowedRoutes(user._id)

                const userInfo = {
                    userId: user._id,
                    username: user.username,
                    roles: user.roles,
                    tenant: user.tenantId,
                    userAllowedRoutes
                };

                res.json({ success: true, user: userInfo, token });
                break;

            case 'pending_admin_approval':
                return res.json({
                    success: false,
                    message: 'Pending approval by the Admin. Please contact your restraunt Admin!',
                });

            case 'pending_superadmin_approval':
                return res.json({
                    success: false,
                    message: 'Pending approval by the Superadmin. Please contact Beavertail customer support!',
                });

            case 'declined':
                return res.json({
                    success: false,
                    message: 'Your approval request is declined!',
                });

            default:
                return res.json({
                    success: false,
                    message: 'Unknown user status!',
                });
        }
    } catch (err) {
        console.error('Error signing user:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.userSignOut = async (req, res) => {
    if (req.headers && req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res
                .status(401)
                .json({ success: false, message: 'Authorization fail!' });
        }

        const tokens = req.user.tokens;

        const newTokens = tokens.filter(t => t.token !== token);
        await User.findByIdAndUpdate(req.user._id, { tokens: newTokens });
        res.json({ success: true, message: 'Sign out successfully!' });
    } else {
        res.json({ success: false, message: 'Authorization header not found!' });
    }
}

exports.getUser = async (req, res) => {
    try {
        const { userId } = req.body

        const selectedFields = '_id username firstName lastName email mobileNo address tenantId status roles';
        const user = await User.findById(userId).select(selectedFields)

        res.json({ success: true, user });
    } catch (err) {
        console.error('Error getting user:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getNonApprovedUsers = async (req, res) => {
    try {
        const { tenantId, status } = req.body

        const selectedFields = '_id username firstName lastName email mobileNo address tenantId status roles';
        const users = await User.find({ tenantId, status }).select(selectedFields)

        res.json({ success: true, users });
    } catch (err) {
        console.error('Error getting non approved users:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getApprovedUsers = async (req, res) => {
    try {
        const { tenantId } = req.body

        const selectedFields = '_id username firstName lastName email mobileNo address tenantId status roles'
        const users = await User.find({ tenantId, status: 'approved' }).select(selectedFields)

        res.json({ success: true, users });
    } catch (err) {
        console.error('Error getting approved users:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.updateUser = async (req, res) => {
    try {
        const { _id, username, firstName, lastName, email, mobileNo, address, tenantId, status, roles } = req.body;
        console.log(req.body);
        const updateObject = {
            username: username,
            firstName: firstName,
            lastName: lastName,
            email: email,
            mobileNo: mobileNo,
            address: address,
            tenantId: tenantId,
            status: status,
            roles: roles,
        };

        const updatedUser = await User.findByIdAndUpdate(req.body._id, updateObject, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User updated successfull' });
    } catch (err) {
        console.error('Error updating user:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


exports.updateUserStatus = async (req, res) => {
    try {
        const { userId, rolesAssigned, newStatus } = req.body;

        const formattedRoles = rolesAssigned.map(role => ({
            roleName: role.roleName,
            roleId: role._id,
        })) || [];

        const updateObject = {
            status: newStatus,
            roles: formattedRoles,
        };

        const updatedUser = await User.findByIdAndUpdate(userId, updateObject, { new: true });

        res.json({ success: true, user: 'User status and roles updated successfully' });
    } catch (err) {
        console.error('Error updating user status:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.userAllowedRoutes = async (userId) => {
    try {
        // const { userId } = req.body;

        const user = await User.findById(userId).populate('roles.roleId');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userAllowedRoutes = [];

        for (const role of user.roles) {
            if (role.roleId && role.roleId.featureIds) {
                const featureLinks = await Feature.find({ _id: { $in: role.roleId.featureIds } }, 'featureLink');
                userAllowedRoutes.push(...featureLinks.map(feature => feature.featureLink));
            }
        }

        const uniqueRoutes = [...new Set(userAllowedRoutes.flat())];

        return ({ success: true, userAllowedRoutes: uniqueRoutes });
    } catch (error) {
        console.error('Error fetching user allowed routes:', error.message);
        // res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

exports.changePassword = async (req, res) => {
    try {
        const { userId, prevPassword, newPassword } = req.body;

        const user = await User.findById(userId);

        const isMatch = await user.comparePassword(prevPassword);
        if (!isMatch) {
            return res.json({
                success: false,
                message: 'Previous password is incorrect.',
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 8);
        await User.updateOne({ _id: userId }, { $set: { password: hashedPassword } });

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error changing password:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
