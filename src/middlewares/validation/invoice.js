const { check, validationResult } = require('express-validator')
const unitMapping = require('../../models/ingredient/unitmapping');

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

const validateIngredientUnit = async (units, { req }) => {
    try {
        const validUnits = ['kg', 'g', 'lbs', 'oz', 'l', 'ml', 'gal', 'piece'];
        const errors = [];
        for (let ingredient of req.body.ingredients) {
            const unit = ingredient.unit;   
            const ingredientId = ingredient.ingredient_id;

            const unitMap = await unitMapping.findOne({ ingredient_id: ingredientId });

            if (!unitMap && !validUnits.includes(unit)) {
                errors.push(ingredient.name);
            } else if (unitMap && !unitMap.fromUnit.some(fromUnit => fromUnit.unit === unit)) {
                errors.push(ingredient.name);
            }
        }

        if (errors.length > 0) {
            req.invalidIngredients = errors;
            return Promise.reject(errors);
        }

        return true;
    } catch (err) {
        console.log(err);
        throw new Error('Server error during validation');
    }
};

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
        .withMessage('Unit is required')
        .custom((units, { req }) => validateIngredientUnit(units, { req }))
        .withMessage((value, { req }) => {
            return `Invalid unit in ingredients: ${req.invalidIngredients.join(', ')}`;
        }),

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
        .withMessage('Invalid payment mode, must be one of the given options'),

    check('statusType')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Invoice Status is required')
        .isIn(['Pending Review', 'Pending Approval'])
        .withMessage('Invalid invoice status type'),

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
        .withMessage('Invalid invoice status type'),
]

exports.invoiceValidation = (req, res, next) => {
    const result = validationResult(req).array()
    if (!result.length) return next()

    const error = result[0].msg;
    res.json({ success: false, message: error })
}
