const { body } = require("express-validator");

const registerValidators = [
    body('username').isLength({ min: 3, max: 30 }).withMessage('username 3-30 chars'),
    body('email').isEmail().withMessage('valid email required'),
    body('password').isLength({ min: 8}).withMessage('password min 8 chars')
];

const loginVlidator = [
    body('username').optional().isString(),
    body('email').optional().isEmail(),
    body('password').exists().withMessage('password required')
];

module.exports = {
    registerValidators,
    loginVlidator
};