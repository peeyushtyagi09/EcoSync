const express = require('express');
const router = express.Router();
const cookieParser = require("cookie-parser");
const { register, login, refreshToken, logout } = require("../controllers/authController");
const { registerValidators, loginVlidator } = require('../validators/authValidators')

router.use(cookieParser());

// Public
router.post('/User/register', registerValidators, register);
router.post('/User/login', loginVlidator, login);

// refresh uses cookie
router.post('/User/refresh', refreshToken);

// revoke /logout
router.post('/User/logout', logout);

module.exports = router;