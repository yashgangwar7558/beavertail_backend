const express = require('express');
const router = express.Router();

const {
    processBill,
} = require('../../controllers/sales/processBill')

const { isAuth } = require('../../middlewares/auth');

router.post('/process-bill', processBill);

module.exports = router;