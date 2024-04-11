const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobileNo: {
        type: String,
        required: true,
        unique: true,
    },
    address: {
        type: String,
        default: '',
    },
    roles: {
        type: [{
            roleName: { type: String },
            roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }
        }],
        default: []
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
    },
    status: {
        type: String,
        required: true, // pending_admin_approval, pending_superadmin_approval, approved, declined
    },
    tokens: [{ type: Object }],
});


userSchema.pre('save', function (next) {
    if (this.isModified('password')) {
        bcrypt.hash(this.password, 8, (err, hash) => {
            if (err) return next(err);

            this.password = hash;
            next();
        });
    }
});

userSchema.methods.comparePassword = async function (password) {
    if (!password) throw new Error('Password is missing, can not compare!');

    try {
        const result = await bcrypt.compare(password, this.password);
        return result;
    } catch (error) {
        console.log('Error while comparing password!', error.message);
    }
};

userSchema.statics.isThisEmailInUse = async function (email) {
    if (!email) throw new Error('Invalid Email');
    try {
        const user = await this.findOne({ email });
        if (user) return false;

        return true;
    } catch (error) {
        console.log('error inside isThisEmailInUse method', error.message);
        return false;
    }
}

userSchema.statics.isThisMobileNoInUse = async function (mobileNo) {
    if (!mobileNo) throw new Error('Invalid number');
    try {
        const user = await this.findOne({ mobileNo });
        if (user) return false;

        return true;
    } catch (error) {
        console.log('error inside isThisMobileNoInUse method', error.message);
        return false;
    }
}

userSchema.statics.isThisUsernameInUse = async function (username) {
    if (!username) throw new Error('Invalid Username');
    try {
        const user = await this.findOne({ username });
        if (user) return false;

        return true;
    } catch (error) {
        console.log('error inside isThisUsernameInUse method', error.message);
        return false;
    }
}

const User = new mongoose.model("User", userSchema);

module.exports = User;