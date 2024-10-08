const { check, body, validationResult } = require('express-validator')
const Role = require('../../models/user/role')

const checkUniqueRoles = async (rolesAssigned) => {
  const ids = rolesAssigned.map(role => role._id);
  const uniqueIds = new Set(ids);

  if (ids.length !== uniqueIds.size) {
    throw new Error('Roles must be unique');
  }

  return true;
}

const checkInvalidRoles = async (rolesAssigned, { req }) => {
  const { tenantId } = req.body

  const roleIds = rolesAssigned.map(role => mongoose.Types.ObjectId(role._id))
  const roles = await Role.find({ _id: { $in: roleIds }, tenantId: tenantId })

  const foundRoleIds = roles.map(role => role._id.toString())
  const invalidRoles = roleIds.filter(role => !foundRoleIds.includes(role))

  if (invalidRoles.length > 0) {
    throw new Error(`The following roles are invalid or do not exist for the given tenant: ${invalidRoles.join(', ')}`);
  }
}

exports.validateUserSignUp = [
  check('username')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Username is required!')
    .isLength({ min: 5 })
    .withMessage('Username must be at least 5 characters long')
    .matches(/^[A-Z][a-zA-Z0-9_-]*$/)
    .withMessage('Username must start with a capital letter and can only contain letters, numbers, underscores, and dashes')
    .matches(/^\S*$/)
    .withMessage('Username cannot contain spaces!'),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password is empty!')
    .isLength({ min: 8, max: 20 })
    .withMessage('Password must be 8 to 20 characters long!')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Z][a-zA-Z\d@$!%*?&#]{7,19}$/)
    .withMessage('Password must start with a capital letter, and should contain upper and lower case letters, numbers, and special characters')
    .matches(/^\S*$/)
    .withMessage('Password cannot contain spaces!'),
  check('confirmPassword')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Confirm Password is empty!')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirm password must be same as password!');
      }
      return true
    })
    .matches(/^\S*$/)
    .withMessage('Confirm Password cannot contain spaces!'),
  check('firstName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('First Name is required!')
    .isString()
    .withMessage('Must be a valid first name!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Name must be within 3 to 20 character!'),
  check('lastName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Last Name is required!')
    .isString()
    .withMessage('Must be a valid last name!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Name must be within 3 to 20 character!'),
  check('email').normalizeEmail().isEmail().withMessage('Invalid email!'),
  check('mobileNo')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Mobile number is required!')
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Invalid mobile number!'),
  // check('address')
  //   .trim()
  //   .not()
  //   .isEmpty()
  //   .withMessage('Address is required!')
  //   .isLength({ min: 5, max: 100 })
  //   .withMessage('Address must be between 5 and 100 characters long'),
  check('tenantId')
    .notEmpty().withMessage('Tenant is required!')
    .isMongoId().withMessage('Invalid Tenant!'),
];

exports.validateUserSignIn = [
  check('username')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Username is required!')
    .custom(value => !/\s/.test(value))
    .withMessage('Invalid Username!'),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password is required!')
    .custom(value => !/\s/.test(value))
    .withMessage('Invalid Password!')
]

exports.validatePasswordChange = [
  check('prevPassword')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Previous Password is empty!')
    .custom(value => !/\s/.test(value))
    .withMessage('Invalid Previous Password!'),
  check('newPassword')
    .trim()
    .not()
    .isEmpty()
    .withMessage('New Password is empty!')
    .isLength({ min: 8, max: 20 })
    .withMessage('New Password must be 8 to 20 characters long!')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Z][a-zA-Z\d@$!%*?&]{7,19}$/)
    .withMessage('Password must start with a capital letter, and should contain upper and lower case letters, numbers, and special characters')
    .matches(/^\S*$/)
    .withMessage('New Password cannot contain spaces!'),
  check('confNewPassword')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Confirm Password is empty!')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Confirm password must be same as new password!');
      }
      return true
    })
    .matches(/^\S*$/)
    .withMessage('Confirm Password cannot contain spaces!'),
]

exports.validateUpdateUser = [
  check('username')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Username is required!')
    .isLength({ min: 5 })
    .withMessage('Username must be at least 5 characters long')
    .matches(/^[A-Z][a-zA-Z0-9_-]*$/)
    .withMessage('Username must start with a capital letter and can only contain letters, numbers, underscores, and dashes')
    .matches(/^\S*$/)
    .withMessage('Username cannot contain spaces!'),
  check('firstName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('First Name is required!')
    .isString()
    .withMessage('Must be a valid first name!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Name must be within 3 to 20 character!'),
  check('lastName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Last Name is required!')
    .isString()
    .withMessage('Must be a valid last name!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Name must be within 3 to 20 character!'),
  check('email').normalizeEmail().isEmail().withMessage('Invalid email!'),
  check('mobileNo')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Mobile number is required!')
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Invalid mobile number!'),
]

exports.validateUserStatus = [
  body('status')
    .if(body('newStatus').not().exists())
    .trim()
    .not()
    .isEmpty()
    .withMessage('User Status is required')
    .isIn(['declined', 'approved', 'pending_admin_approval', 'pending_superadmin_approval'])
    .withMessage('Invalid user status'),

  body('newStatus')
    .if(body('status').not().exists())
    .trim()
    .not()
    .isEmpty()
    .withMessage('User Status is required')
    .isIn(['declined', 'approved', 'pending_admin_approval', 'pending_superadmin_approval'])
    .withMessage('Invalid user status'),
]

exports.validateUserRoles = [
  check('rolesAssigned')
    .isArray({ min: 1 })
    .withMessage('Assign atleast one role')
    .custom((rolesAssigned) => checkUniqueRoles(rolesAssigned))
    .withMessage('Roles assigned must be unique')
    .custom((rolesAssigned, { req }) => checkInvalidRoles(rolesAssigned, { req }))
]

exports.userValidation = (req, res, next) => {
  const result = validationResult(req).array()
  if (!result.length) return next()

  const error = result[0].msg
  res.json({ success: false, message: error })
}
