const express = require('express');
const router = express.Router();

const {
  createUser,
  userSignIn,
  userSignOut,
  getNonApprovedUsers,
  getApprovedUsers,
  updateUserStatus,
  userAllowedRoutes,
  getUser,
  updateUser,
  changePassword
} = require('../../controllers/user/user')

const { isAuth } = require('../../middlewares/auth')

const {
  validateUserSignUp,
  validateUserSignIn,
  userValidation,
} = require('../../middlewares/validation/user')

router.post('/create-user', validateUserSignUp, userValidation, createUser);
router.post('/sign-in', validateUserSignIn, userValidation, userSignIn);
router.post('/sign-out', isAuth, userSignOut);
router.post('/get-user', getUser);
router.post('/get-nonapproved-users', getNonApprovedUsers);
router.post('/get-approved-users', getApprovedUsers);
router.post('/get-user-allowed-routes', userAllowedRoutes);
router.post('/update-user', updateUser);
router.post('/update-user-status', updateUserStatus);
router.post('/change-password', changePassword);

module.exports = router;