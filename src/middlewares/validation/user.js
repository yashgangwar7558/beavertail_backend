const { check, validationResult } = require('express-validator');

exports.validateUserSignUp = [
  check('username')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Username is required!')
    .isLength({ min: 5 })
    .withMessage('Username must be at least 5 characters long')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and dashes'),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password is empty!')
    .isLength({ min: 8, max: 20 })
    .withMessage('Password must be 8 to 20 characters long!'),
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
    }),
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
];

exports.userValidation = (req, res, next) => {
  const result = validationResult(req).array();
  if (!result.length) return next();

  const error = result[0].msg;
  res.json({ success: false, message: error });
};
