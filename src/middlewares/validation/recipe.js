const { check, validationResult } = require('express-validator')

exports.parseRecipeYields = (req, res, next) => {
    try {
        if (req.body.yields) {
            req.body.yields = JSON.parse(req.body.yields);
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

exports.parseRecipeIngredients = (req, res, next) => {
    try {
        if (req.body.ingredients) {
            req.body.ingredients = JSON.parse(req.body.ingredients);
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

exports.validateRecipe = [
    check('tenantId')
        .trim()
        .not()
        .isEmpty()
        .withMessage('User unauthenticated. Try relogin'),

    check('name')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Recipe Name is required'),

    check('category')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Type is required'),

    check('subCategory')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Sub Type is required'),

    check('yields')
        .isArray({ min: 1 })
        .withMessage('Add atleast one yield'),

    check('yields.*.quantity')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Yield Quantity is required'),

    check('yields.*.unit')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Yield Unit is required'),

    check('methodPrep')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Method of Preperation is required'),

    check('ingredients')
        .isArray({ min: 1 })
        .withMessage('Add atleast one ingredient'),

    check('ingredients.*.name')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Ingredient Name is required'),

    check('ingredients.*.category')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Ingredient Category is required'),

    check('ingredients.*.quantity')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Ingredient Quantity is required'),

    check('ingredients.*.unit')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Ingredient Unit is required'),

    check('modifierCost')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Additional Cost is required'),

    check('menuPrice')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Menu Price is required'),

    check('menuType')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Menu Type is required'),
]

exports.recipeValidation = (req, res, next) => {
    const result = validationResult(req).array()
    if (!result.length) return next()

    const error = result[0].msg;
    res.json({ success: false, message: error })
}