const express = require('express');
const router = express.Router();

const {
    createPosRef,
    getTenantsByPosId,
    getLastSynced,
    updateLastSynced
} = require('../../controllers/tenant/posRef')

router.post('/create-posRef', createPosRef);
router.post('/get-pos-tenants', getTenantsByPosId);
router.post('/get-lastSynced', getLastSynced);
router.post('/update-lastSynced', updateLastSynced);

module.exports = router;