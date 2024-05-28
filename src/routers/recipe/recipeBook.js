const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
    createRecipe,
    getRecipe,
    getAllRecipe,
    deleteRecipe,
    updateRecipe
} = require('../../controllers/recipe/recipeBook')

const { isAuth } = require('../../middlewares/auth');

const {
    parseRecipeIngredients,
    parseRecipeYields,
    validateRecipe,
    recipeValidation
} = require('../../middlewares/validation/recipe')

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

router.post('/create-recipe', upload.single('photo'), parseRecipeYields, parseRecipeIngredients, validateRecipe, recipeValidation, createRecipe);
router.post('/update-recipe', upload.single('photo'), parseRecipeYields, parseRecipeIngredients, validateRecipe, recipeValidation, updateRecipe);
router.post('/get-recipe', getRecipe);
router.post('/get-recipes', getAllRecipe);
router.post('/delete-recipe', deleteRecipe);

module.exports = router;