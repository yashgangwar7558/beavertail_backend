const express = require('express');
const router = express.Router();

const {
    createFeature,
    getFeature,
    getAllFeatures
} = require('../../controllers/user/feature')

const { isAuth } = require('../../middlewares/auth');

router.post('/create-feature', createFeature);
router.post('/get-feature', getFeature);
router.post('/get-all-features', getAllFeatures);

module.exports = router;