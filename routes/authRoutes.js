const express = require("express");
const {body} = require("express-validator");
const{register,login} = require("../controllers/authcontoller");

const router = express.Router();

const registerValidation = [
    body('username').trim().isLength({min:3, max:10}),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({min:6})
]

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

router.post("/register",registerValidation,register);
router.post("/login",loginValidation,login);

module.exports = router;
