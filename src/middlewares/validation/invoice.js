const { check, validationResult } = require('express-validator')

exports.parseInvoiceIngredients = (req, res, next) => {
    try {
        if (req.body.ingredients) {
            req.body.ingredients = JSON.parse(req.body.ingredients);
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

exports.validateInvoice = [
    check('tenantId')
        .trim()
        .not()
        .isEmpty()
        .withMessage('User unauthenticated. Try relogin'),

    check('invoiceNumber')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Invoice number is required'),

    check('vendor')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Vendor name is required'),

    check('invoiceDate')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Invoice date is required'),

    check('ingredients')
        .isArray({ min: 1 })
        .withMessage('Add atleast one ingredient'),

    check('ingredients.*.name')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Ingredient name is required'),

    check('ingredients.*.quantity')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Quantity is required'),

    check('ingredients.*.unit')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Unit is required'),

    check('ingredients.*.unitPrice')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Unit price is required'),

    check('ingredients.*.total')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Ingredient total is required'),

    check('payment')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Payment mode is required'),

    check('total')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Total amount is required'),
]

exports.invoiceValidation = (req, res, next) => {
    const result = validationResult(req).array()
    if (!result.length) return next()

    const error = result[0].msg;
    res.json({ success: false, message: error })
}
