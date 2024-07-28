const { check, validationResult } = require('express-validator')

exports.validateBill = [
    check('tenantId')
        .trim()
        .not()
        .isEmpty()
        .withMessage('User unauthenticated. Try relogin'),

    check('billNumber')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Bill Number is required'),

    check('customerName')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Customer Name is required'),

    check('billingDate')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Billing Date is required'),

    check('itemsOrdered')
        .isArray({ min: 1 })
        .withMessage('Add atleast one item'),

    check('itemsOrdered.*.name')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Item name is required'),

    check('itemsOrdered.*.quantity')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Item quantity is required')
        .isInt({ min: 1 })
        .withMessage('Item quantity must be greater than zero'),

    check('itemsOrdered.*.menuPrice')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Item price is required')
        .isFloat({ min: 0.01 })
        .withMessage('Item price must be greater than zero'),

    // check('itemsOrdered.*.discountAmount')
    //     .trim()
    //     .not()
    //     .isEmpty()
    //     .withMessage('Item Discount Amount is required'),
    // .isFloat({ min: 0.00 })
    // .withMessage('Item Discount Amount must be greater than zero'),

    check('itemsOrdered.*.total')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Item total is required')
        .isFloat({ min: 0.00 })
        .withMessage('Item total must be greater than zero'),

    // check('itemsOrdered.*.taxAmount')
    //     .trim()
    //     .not()
    //     .isEmpty()
    //     .withMessage('Item Tax Amount is required'),
    // .isFloat({ min: 0.00 })
    // .withMessage('Item Tax Amount must be greater than zero'),

    check('itemsOrdered.*.totalPayable')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Item Total Payable is required'),
    // .isFloat({ min: 0.00 })
    // .withMessage('Item Total Payable must be greater than zero'),

    check('discountAmount')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Discount Amount is required'),
    // .isFloat({ min: 0.00 })
    // .withMessage('Discount Amount must be greater than zero'),

    check('total')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Subtotal is required'),
    // .isFloat({ min: 0.00 })
    // .withMessage('Subtotal must be greater than zero'),

    check('taxAmount')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Tax amount is required'),
    // .isFloat({ min: 0.00 })
    // .withMessage('Tax Amount must be greater than zero'),


    check('totalPayable')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Total Payable amount is required'),
    // .isFloat({ min: 0.00 })
    // .withMessage('Total Payable amount must be greater than zero'),
]

exports.billValidation = (req, res, next) => {
    const result = validationResult(req).array()
    if (!result.length) return next()

    const error = result[0].msg;
    res.json({ success: false, message: error })
}