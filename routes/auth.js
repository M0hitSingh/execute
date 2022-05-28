const express = require("express");
const router = express.Router();
const {body} = require("express-validator");

const authController = require("../controllers/auth");

router.post("/signup", authController.otp);

router.post("/otpVerification", [
  body("email").normalizeEmail().isEmail()
  .withMessage('please enter a valid email'),
  body("password").trim()
], authController.otpVerification);

router.post("/login", authController.login);

router.post("/generateaccesstoken", authController.generateAccessToken);

router.post("/details", authController.details);

module.exports=router; 