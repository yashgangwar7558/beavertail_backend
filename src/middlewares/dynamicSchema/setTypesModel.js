const createTypesModel = require('../../models/recipe/types');

const setTypesModel = (req, res, next) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' });
    }

    req.Types = createTypesModel(userId);
    next();
};

module.exports = setTypesModel;
