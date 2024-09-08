const menuExtractionStatus = require('../../models/recipe/menuExtractionStatus')

exports.getExtractionProcesses = async (req, res) => {
    try {
        const processes = await menuExtractionStatus.find({})

        res.json({ success: true, processes })
    } catch (error) {
        console.error('Error getting extraction processes:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}