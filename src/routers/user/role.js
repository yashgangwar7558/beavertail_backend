const express = require('express');
const router = express.Router();

const {
    createRole,
    getRole,
    getAllRoles
} = require('../../controllers/user/role')

const { isAuth } = require('../../middlewares/auth');

router.post('/create-role', createRole);
router.post('/get-role', getRole);
router.post('/get-all-roles', getAllRoles);

module.exports = router;