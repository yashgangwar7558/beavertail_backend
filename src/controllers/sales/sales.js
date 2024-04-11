const mongoose = require('mongoose');
const User = require('../../models/user/user');
const Tenant = require('../../models/tenant/tenant');
const Sales = require('../../models/sales/sales');
const { formatDate } = require('../helper');
const { log } = require('console');

exports.createBill = async (tenantId, billNumber, customerName, billingDate, itemsOrdered, total, session) => {
    try {
        const result = await Sales.create([{
            tenantId,
            billNumber,
            customerName,
            billingDate,
            itemsOrdered,
            total
        }], {session})
        return result[0]
    } catch (err) {
        console.log('Error creating bill:', err.message);
        throw err
    }
}

exports.getBillsBetweenDates = async (tenantId, startDate, endDate) => {
    try {
        const result = await Sales.find({
            tenantId: tenantId,
            billingDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            },
        })
        return result
    } catch (err) {
        console.error('Error fetching bills between dates:', err.message);
        throw err
    }
}

exports.getBillsCountBetweenDates = async (req, res) => {
    try {

        const { tenantId, startDate, endDate } = req.body

        const CstartDate = new Date(startDate)
        const CendDate = new Date(endDate)

        const countBills  = await Sales.countDocuments({
            tenantId: tenantId,
            billingDate: {
                $gte: new Date(CstartDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
                $lte: new Date(CendDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
            },
        })
        res.json({ success: true, countBills });
    } catch (err) {
        console.error('Error fetching bills count:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getBillInfo = async (req, res) => {
    try {
        const { billingId } = req.body;

        const bill = await Sales.findById(billingId);

        if (!bill) {
            return res.json({
                success: false,
                message: 'Bill not found!',
            });
        }

        bill.uploadDate = formatDate(bill.uploadDate);

        res.json({ success: true, bill });
    } catch (error) {
        console.error('Error fetching bill:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getAllBills = async (req, res) => {
    try {
        const { tenantId } = req.body;

        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.json({
                success: false,
                message: 'Tenant not found!',
            });
        }

        const bills = await Sales.find({ tenantId: tenant._id });

        const formattedDateBills = bills.map((bill) => {
            return {
                ...bill._doc,
                uploadDate: formatDate(bill.uploadDate),
            };
        });

        res.json({ success: true, bills: formattedDateBills });
    } catch (error) {
        console.error('Error fetching bills:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// exports.currentDaySale = async (req, res) => {
//     try {
//         const currentDate = new Date();
//         const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
//         const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);

//         const totalSales = await Sales.aggregate([
//             {
//                 $match: {
//                     billingDate: {
//                         $gte: startOfDay,
//                         $lt: endOfDay,
//                     },
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalSales: { $sum: { $toDouble: '$total' } },
//                 },
//             },
//         ]);

//         res.json({ success: true, totalSales: totalSales.length > 0 ? totalSales[0].totalSales : 0 });
//     } catch (error) {
//         console.error('Error calculating total sales for current date:', error.message);
//         res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// }

// exports.currentMonthSale = async (req, res) => {
//     try {
//         const currentDate = new Date();
//         const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//         const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

//         const totalSales = await Sales.aggregate([
//             {
//                 $match: {
//                     billingDate: {
//                         $gte: startOfMonth,
//                         $lt: endOfMonth,
//                     },
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalSales: { $sum: { $toDouble: '$total' } },
//                 },
//             },
//         ]);

//         res.json({ success: true, totalSales: totalSales.length > 0 ? totalSales[0].totalSales : 0 });
//     } catch (error) {
//         console.error('Error calculating total sales for current month:', error.message);
//         res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// }

// exports.currentYearSale = async (req, res) => {
//     try {
//         const currentDate = new Date();
//         const startOfCurrentYear = new Date(currentDate.getFullYear(), 0, 1);
//         const endOfCurrentYear = new Date(currentDate.getFullYear() + 1, 0, 0);

//         const totalSales = await Sales.aggregate([
//             {
//                 $match: {
//                     billingDate: {
//                         $gte: startOfCurrentYear,
//                         $lt: endOfCurrentYear,
//                     },
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalSales: { $sum: { $toDouble: '$total' } },
//                 },
//             },
//         ]);

//         res.json({ success: true, totalSales: totalSales.length > 0 ? totalSales[0].totalSales : 0 });
//     } catch (error) {
//         console.error('Error calculating total sales for the current year:', error.message);
//         res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// }

// exports.pastOneYearMonthWiseSale = async (req, res) => {
//     try {
//         const currentDate = new Date();
//         const startOfPastYear = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
//         const endOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

//         const totalSales = await Sales.aggregate([
//             {
//                 $match: {
//                     billingDate: {
//                         $gte: startOfPastYear,
//                         $lt: endOfCurrentMonth,
//                     },
//                 },
//             },
//             {
//                 $group: {
//                     _id: {
//                         month: { $month: '$billingDate' },
//                         year: { $year: '$billingDate' },
//                     },
//                     totalSales: { $sum: { $toDouble: '$total' } },
//                 },
//             },
//             {
//                 $sort: {
//                     '_id.year': 1,
//                     '_id.month': 1,
//                 },
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     x: {
//                         $concat: [
//                             {
//                                 $switch: {
//                                     branches: [
//                                         { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
//                                         { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
//                                         { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
//                                         { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
//                                         { case: { $eq: ['$_id.month', 5] }, then: 'May' },
//                                         { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
//                                         { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
//                                         { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
//                                         { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
//                                         { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
//                                         { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
//                                         { case: { $eq: ['$_id.month', 12] }, then: 'Dec' },
//                                     ],
//                                     default: '',
//                                 },
//                             },
//                             '-',
//                             { $substr: ['$_id.year', 2, 2] },
//                         ],
//                     },
//                     y: '$totalSales',
//                 },
//             },
//         ]);

//         const monthsInRange = [];
//         let currentMonth = new Date(startOfPastYear);
//         while (currentMonth < endOfCurrentMonth) {
//             const formattedMonth = `${currentMonth.toLocaleString('default', { month: 'short' })}-${currentMonth.getFullYear().toString().slice(2)}`;
//             monthsInRange.push(formattedMonth);
//             currentMonth.setMonth(currentMonth.getMonth() + 1);
//         }

//         const salesMap = new Map(totalSales.map(item => [item.x, item.y]));
//         const filledSales = monthsInRange.map(month => ({ x: month, y: salesMap.get(month) || 0 }));

//         res.json({ success: true, filledSales });
//     } catch (error) {
//         console.error('Error calculating total sales for the past year:', error.message);
//         res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// }

exports.totalSalesBetweenDates = async (req, res) => {
    try {
        const { tenantId, startDate, endDate } = req.body

        const CstartDate = new Date(startDate)
        const CendDate = new Date(endDate)

        const totalSales = await Sales.aggregate([
            {
                $match: {
                    tenantId: new mongoose.Types.ObjectId(tenantId),
                    billingDate: {
                        $gte: new Date(CstartDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
                        $lte: new Date(CendDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: { $toDouble: '$total' } },
                },
            },
        ]);

        res.json({ success: true, totalSales: totalSales.length > 0 ? totalSales[0].totalSales : 0 });
    } catch (error) {
        console.error('Error calculating total sales between given duration:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.monthWiseSalesBetweenDates = async (req, res) => {
    try {
        const { tenantId, startDate, endDate } = req.body

        const CstartDate = new Date(startDate)
        const CendDate = new Date(endDate)

        const totalSales = await Sales.aggregate([
            {
                $match: {
                    tenantId: new mongoose.Types.ObjectId(tenantId),
                    billingDate: {
                        $gte: new Date(CstartDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
                        $lte: new Date(CendDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$billingDate' },
                        year: { $year: '$billingDate' },
                    },
                    totalSales: { $sum: { $toDouble: '$total' } },
                },
            },
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1,
                },
            },
            {
                $project: {
                    _id: 0,
                    x: {
                        $concat: [
                            {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                                        { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                                        { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                                        { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                                        { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                                        { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                                        { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                                        { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                                        { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                                        { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                                        { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                                        { case: { $eq: ['$_id.month', 12] }, then: 'Dec' },
                                    ],
                                    default: '',
                                },
                            },
                            '-',
                            { $substr: ['$_id.year', 2, 2] },
                        ],
                    },
                    y: '$totalSales',
                },
            },
        ]);

        const monthsInRange = [];
        let currentMonth = new Date(startOfPastYear);
        while (currentMonth < endOfCurrentMonth) {
            const formattedMonth = `${currentMonth.toLocaleString('default', { month: 'short' })}-${currentMonth.getFullYear().toString().slice(2)}`;
            monthsInRange.push(formattedMonth);
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }

        const salesMap = new Map(totalSales.map(item => [item.x, item.y]));
        const filledSales = monthsInRange.map(month => ({ x: month, y: salesMap.get(month) || 0 }));

        res.json({ success: true, totalSales: filledSales });
    } catch (error) {
        console.error('Error calculating month wise sales for given period:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

