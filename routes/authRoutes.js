const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const loginLimiter = require("../middleware/loginLimiter");

router.route("/login").post(loginLimiter, authController.login);

router.route("/register").post(authController.register);

router.route("/refresh").get(authController.refresh);

router.route("/google").get(authController.GoogleHandler);

router.route("/google/callback").get(authController.GoogleCallback);

router.route("/verifyotp").post(authController.VerifyOTP);

router.route("/createnewotp").post(authController.createNewOTP);

router.route("/createnewlink").post(authController.createNewLink);

router.route("/logout").post(authController.logout);

router.route("/update").patch(authController.updateUser);

router.route("/delete").delete(authController.deleteUser);

router
  .route("/forgotpassword/sendotp")
  .post(authController.sendForgotPasswordOTP);

router
  .route("/forgotpassword/verifyotp")
  .post(authController.verifyForgotPasswordOTP);

router.route("/forgotpassword/reset").post(authController.resetPassword);

router.route("/verify-email").get(authController.verifyEmail);
module.exports = router;
