const express = require("express");
const { body } = require("express-validator");
const { register, login } = require("../controllers/authcontoller");
const validate = require("../utils/validate");
const { authLimiter } = require("../utils/rateLimit");

const router = express.Router();

// Throttle auth endpoints to slow brute-force and bulk sign-ups.
router.use(authLimiter);

const registerValidation = [
  body("username").trim().isLength({ min: 3, max: 10 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

module.exports = router;
