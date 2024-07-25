const { check, body, validationResult } = require('express-validator')

exports.validateTenant = [
    check('tenantName')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Restaurant Name is required!'),
    check('tenantDescription')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Restaurant Description is required!'),
    check('address')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Address is required!'),
    check('country')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Country is required!'),
    check('state')
        .trim()
        .not()
        .isEmpty()
        .withMessage('State is required!'),
    check('city')
        .trim()
        .not()
        .isEmpty()
        .withMessage('City is required!'),
    check('invoiceEmails')
        .isArray({ min: 1 })
        .withMessage('Add atleast one invoice email'),
    check('invoiceEmails.*')
        .normalizeEmail().isEmail().withMessage('Invalid email in invoice emails!'),
    check('billEmails')
        .isArray({ min: 1 })
        .withMessage('Add atleast one bill email'),
    check('billEmails.*')
        .normalizeEmail().isEmail().withMessage('Invalid email in bill emails!'),
    check('contact.firstName')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Contact Firstname is required!').isString()
        .withMessage('Must be a valid first name!')
        .isLength({ min: 3, max: 20 })
        .withMessage('Name must be within 3 to 20 character!'),
    check('contact.lastName')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Contact Lastname is required!')
        .isString()
        .withMessage('Must be a valid last name!')
        .isLength({ min: 3, max: 20 })
        .withMessage('Name must be within 3 to 20 character!'),
    check('contact.email')
        .normalizeEmail().isEmail().withMessage('Invalid email in contact info!'),
    check('contact.phone')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Contact phone no. is required!')
        .isMobilePhone('any', { strictMode: false })
        .withMessage('Invalid mobile number!'),
]

exports.tenantValidation = (req, res, next) => {
    const result = validationResult(req).array()
    if (!result.length) return next()

    const error = result[0].msg
    res.json({ success: false, message: error })
}