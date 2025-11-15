const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const deviceAuth = require('../middleware/deviceAuth');
const controller = require('../controllers/Devices_controller');

// user reverify with password -> return a short-lived reverify token
router.post('/reverify', auth, [
    body('password').exists().withMessage('password required')
], controller.requirePasswordReverify);

// user create a link request (requires reverify token in header x-reverify-token)
router.post('/link-request', auth, controller.completeLinking);

// Agest calls this to complete linking. Public does NOT require user JWT
router.post('/link-complete', auth, controller.createLinkRequest);

// List devices for user
router.get('/', auth, controller.listDevices);

// rename device
router.patch('/:deviceId/rename', auth, [
    body('name').isLength({ min: 1}).withMessage('name required'),
], controller.renameDevice);

// revoke device
router.post('/:device/revoke', auth, controller.revokeDevice);

// Example protected agent-only route: agent uses deviceAuth middleware
router.get('/agent/ping', deviceAuth, (req, res) => {
    res.json({ success: true, date: { deviceId: req.device.deviceId, user: req.user.username }});
});

module.exports = router;
