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
]

exports.tenantValidation = (req, res, next) => {
    const result = validationResult(req).array()
    if (!result.length) return next()

    const error = result[0].msg
    res.json({ success: false, message: error })
}