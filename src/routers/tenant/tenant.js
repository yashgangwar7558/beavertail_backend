const express = require('express');
const router = express.Router();

const {
    createTenant,
    getTenant,
    getActiveTenants,
    getActiveTenantIds,
    updateTenant,
    createShift4Tenant,
    getAllTenants,
    markTenantInactiveByShift4,
    markTenantInactive,
    markTenantActive
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
router.post('/get-all-tenants-active-inactive', getAllTenants);
router.post('/get-tenantids', getActiveTenantIds);
router.post('/mark-tenant-inactive-shift4', markTenantInactiveByShift4);
router.post('/mark-tenant-inactive', markTenantInactive);
router.post('/mark-tenant-active', markTenantActive);

router.post('/create-shift4-tenant', createShift4Tenant);

module.exports = router;