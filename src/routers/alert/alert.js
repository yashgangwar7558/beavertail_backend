const express = require('express');
const router = express.Router();

const {
    createAlert,
    getAlerts,
    updateActiveStatus
} = require('../../controllers/alert/alert')

router.post('/create-alert', async (req, res) => {
    try {
        const { tenantId, type, name, details, severity } = req.body
        const alert = await createAlert(tenantId, type, name, details, severity)
        res.json({ success: true, message: 'Alert generated successfully!'});
    } catch (error) {
        console.error('Error creating alert', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/get-alerts', getAlerts)
router.post('/update-active-status', updateActiveStatus)

module.exports = router;

// module.exports = function(io) { 
//     router.post('/create-alert', async (req, res) => {
//         try {
//             const { tenantId, type, name, details } = req.body;
//             const alert = await createAlert(tenantId, type, name, details);
//             res.json({ success: true, message: 'Alert generated successfully!' });
//         } catch (error) {
//             console.error('Error creating alert', error.message);
//             res.status(500).json({ success: false, message: 'Internal Server Error' });
//         }
//     });

//     return router;
// };