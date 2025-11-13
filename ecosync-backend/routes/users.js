const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const { getProfile, updateProfile } = require("../controllers/userController");

router.get('/User/Profile', auth, getProfile);
router.patch('/User/Profile', auth, updateProfile);

module.exports = router;