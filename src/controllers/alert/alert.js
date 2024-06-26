const { Alert } = require('../../models/alert/alert');
const { alertTemplates } = require('../../models/alert/alert');
const { sendAlert } = require('../../utils/socket')

exports.createAlert = async (tenantId, type, name, details, severity) => {
    try {
        const { detailsKeys, messageTemplate, reference } = alertTemplates[type]

        const sanitizedDetails = Object.keys(details)
            .filter(key => detailsKeys.includes(key))
            .reduce((obj, key) => {
                obj[key] = details[key]
                return obj
            }, {})

        const message = messageTemplate(sanitizedDetails)

        const alert = new Alert({
            tenantId: tenantId,
            date: new Date(),
            type: type,
            name: name,
            details: sanitizedDetails,
            message: message,
            severity,
            reference: reference,
            active: true
        })

        await alert.save()
        sendAlert(alert)
        return alert
    } catch (err) {
        console.error('Error generating alert:', err.message)
        throw error
    }
}

exports.getAlerts = async (req, res) => {
    try {
        const { tenantId, active } = req.body
        const alerts = await Alert.find({ tenantId, active }).sort({ date: -1 });
        res.json({ success: true, alerts });
    } catch (err) {
        console.error('Error fetching alerts:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

exports.updateActiveStatus = async (req, res) => {
    try {
        const { tenantId, alertId, active } = req.body

        const updatedAlert = await Alert.findOneAndUpdate(
            { _id: alertId, tenantId },
            { active: active },
            { new: true } 
        );

        if (!updatedAlert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }

        res.status(200).json({ success: true, updatedAlert });
    } catch (err) {
        console.error('Error updating read status:', err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}