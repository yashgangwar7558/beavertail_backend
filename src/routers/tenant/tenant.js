const express = require('express');
const router = express.Router();

const {
    createTenant,
    getTenant,
    getAllTenants,
    getTenantIds,
    updateTenant
} = require('../../controllers/tenant/tenant')

const { isAuth } = require('../../middlewares/auth');

router.post('/create-tenant', createTenant);
router.post('/update-tenant', updateTenant);
router.post('/get-tenant', getTenant);
router.post('/get-all-tenants', getAllTenants);
router.post('/get-tenantids', getTenantIds);

module.exports = router;