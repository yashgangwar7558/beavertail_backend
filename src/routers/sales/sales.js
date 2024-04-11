const express = require('express');
const router = express.Router();

const {
    getBillInfo,
    getAllBills,
    getBillsCountBetweenDates,
    totalSalesBetweenDates,
    monthWiseSalesBetweenDates,
} = require('../../controllers/sales/sales')

const { isAuth } = require('../../middlewares/auth');


router.post('/get-bills', getAllBills);
router.post('/get-bills-count-bw-dates', getBillsCountBetweenDates);
router.post('/total-sales-bw-dates', totalSalesBetweenDates);
router.post('/monthwise-total-sale-bw-dates', monthWiseSalesBetweenDates);

module.exports = router;