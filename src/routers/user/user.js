const express = require('express');
const router = express.Router();

const {
  createUser,
  userSignIn,
  userSignOut,
  getNonApprovedUsers,
  getNonApprovedAdminUsers,
  getApprovedUsers,
  getApprovedAdminUsers,
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
  validatePasswordChange,
  validateUpdateUser,
  validateUserStatus,
  validateUserRoles,
  userValidation,
} = require('../../middlewares/validation/user')

router.post('/create-user', validateUserSignUp, validateUserStatus, userValidation, createUser);
router.post('/sign-in', validateUserSignIn, userValidation, userSignIn);
router.post('/sign-out', isAuth, userSignOut);
router.post('/get-user', getUser);
router.post('/get-nonapproved-users', getNonApprovedUsers);
router.post('/get-nonapproved-admin-users', getNonApprovedAdminUsers);
router.post('/get-approved-users', getApprovedUsers);
router.post('/get-approved-admin-users', getApprovedAdminUsers);
router.post('/get-user-allowed-routes', userAllowedRoutes);
router.post('/update-user', validateUpdateUser, validateUserStatus, userValidation, updateUser);
router.post('/update-user-status', validateUserStatus, userValidation, updateUserStatus);
router.post('/change-password', validatePasswordChange, userValidation, changePassword);

module.exports = router;