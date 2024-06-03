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
        .withMessage('Quantity is required')
        .isFloat({ min: 0.01 })
        .withMessage('Quantity must be greater than zero'),

    check('ingredients.*.unit')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Unit is required'),

    check('ingredients.*.unitPrice')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Unit price is required')
        .isFloat({ min: 0.01 })
        .withMessage('Unit price must be greater than zero'),

    check('ingredients.*.total')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Ingredient total is required')
        .isFloat({ min: 0.01 })
        .withMessage('Ingredient total must be greater than zero'),

    check('payment')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Payment mode is required')
        .isIn(['Net Banking', 'Cash', 'Credit/Debit Card'])
        .withMessage('Payment mode must be one of the given options'),

    check('statusType')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Invoice Status is required')
        .isIn(['Pending Review', 'Pending Approval'])
        .withMessage('Invoice status type invalid'),

    check('total')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Total amount is required')
        .isFloat({ min: 0.01 })
        .withMessage('Total amount must be greater than zero'),
]

exports.validateInvoiceStatus = [
    check('newStatus')
        .trim()
        .not()
        .isEmpty()
        .isIn(['Pending Review', 'Pending Approval', 'Review-Rejected', 'Approval-Rejected', 'Processed-PendingPayment', 'Processed-Paid'])
        .withMessage('Invoice status type invalid'),
]

exports.invoiceValidation = (req, res, next) => {
    const result = validationResult(req).array()
    if (!result.length) return next()

    const error = result[0].msg;
    res.json({ success: false, message: error })
}
