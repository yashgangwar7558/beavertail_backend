const { check, validationResult } = require('express-validator')
const mongoose = require('mongoose')
const Types = require('../../models/recipe/types');
const unitMapping = require('../../models/ingredient/unitmapping');

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

const validateSubCategory = async (value, { req }) => {
    const tenantId = req.body.tenantId;
    const category = req.body.category;

    const recipeType = await Types.findOne({ tenantId, type: category, subType: value });
    if (!recipeType) {
        throw new Error(`Invalid Sub-Category for the selected Category: ${category}`);
    }

    return true
}

const validateIngredientUnit = async (units, { req }) => {
    try {
        const errors = []
        for (let ingredient of req.body.ingredients) {
            const unit = ingredient.unit
            const ingredientId = ingredient.ingredient_id

            const unitMap = await unitMapping.findOne({ ingredient_id: ingredientId })

            if (!unitMap || !unitMap.fromUnit.some(fromUnit => fromUnit.unit === unit)) {
                errors.push(ingredient.name)
            }
        }

        if (errors.length > 0) {
            req.invalidIngredients = errors
            return Promise.reject(errors)
        }

        return true;
    } catch (err) {
        console.log(err);
        throw new Error('Server error during validation');
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
        .withMessage('Type is required')
        .isIn(['Food', 'Beverage'])
        .withMessage('Invalid recipe Category. Allowed categories are Food and Beverage'),

    check('subCategory')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Sub Type is required')
        .custom(validateSubCategory)
        .withMessage('Invalid recipe Sub-Category for the selected Category.'),

    check('yields')
        .isArray({ min: 1 })
        .withMessage('Add atleast one yield'),

    check('yields.*.quantity')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Yield Quantity is required')
        .isFloat({ min: 0.01 })
        .withMessage('Yield Quantity must be greater than zero'),

    check('yields.*.unit')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Yield Unit is required')
        .isIn(['Each', 'Serving'])
        .withMessage('Invalid yield unit. Allowed units are Each and Serving'),

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
        .withMessage('Ingredient Quantity is required')
        .isFloat({ min: 0.01 })
        .withMessage('Ingredient Quantity must be greater than zero'),

    check('ingredients.*.unit')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Ingredient Unit is required')
        .custom((units, { req }) => validateIngredientUnit(units, { req }))
        .withMessage((value, { req }) => {
            return `Invalid unit in ingredients: ${req.invalidIngredients.join(', ')}`;
        }),

    check('modifierCost')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Additional Cost is required')
        .isFloat({ min: 0.01 })
        .withMessage('Additional Cost must be greater than zero'),

    check('menuPrice')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Menu Price is required')
        .isFloat({ min: 0.01 })
        .withMessage('Menu Price must be greater than zero'),

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