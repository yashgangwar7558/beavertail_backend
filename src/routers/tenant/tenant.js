const express = require('express');
const router = express.Router();

const {
    createTenant,
    getTenant,
    getActiveTenants,
    getActiveTenantIds,
    updateTenant,
    createShift4Tenant,
    markTenantInactive
} = require('../../controllers/tenant/tenant')

const {
    validateTenant,
    tenantValidation
} = require('../../middlewares/validation/tenant')

const { isAuth } = require('../../middlewares/auth');

router.post('/create-tenant', validateTenant, tenantValidation, createTenant);
router.post('/update-tenant', validateTenant, tenantValidation, updateTenant);
router.post('/get-tenant', getTenant);
router.post('/get-all-tenants', getActiveTenants);
router.post('/get-tenantids', getActiveTenantIds);
router.post('/mark-tenant-inactive', markTenantInactive);

router.post('/create-shift4-tenant', createShift4Tenant);

module.exports = router;