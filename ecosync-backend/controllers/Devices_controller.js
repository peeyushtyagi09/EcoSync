const { validationResult } = require("express-validator")
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Device = require('../models/Device');
const DeviceLinkRequest = require('../models/DeviceLinkRequest');
const {
    signLinkToken,
    verifyLinkToken,
    generateJti,
    generateDeviceKey,
    hashDeviceKey
} = require('../utils/linkToken');
const User = require('../models/User');

const LINK_TOKEN_EXP_MS = (() => {
    const raw = process.env.LINK_TOKEN_EXPIRES || '3m';
    if(raw.endsWith('m')) return parseInt(raw.slice(0, -1), 10) * 60 * 1000;
    if(raw.endsWith('s')) return parseInt(raw.slice(0, -1), 10) * 1000;
    return 3 * 60 * 1000;
})();

async function requirePasswordReverify(req, res) {
    try {
        const { password } = req.body;
        if(!password) return res.status(400).json({ success: false, message: 'password required' });
        const user = req.user; 
        if(!user) return res.status(400).json({ success: false, message: 'user required'});
        const ok = await bcrypt.compare(password, user.passwordHash);
        if(!ok) return res.status(401).json({ success; false, message: 'invalid password '});

        const jti = generateJti();
        const token = signLinkToken({ userId: user._id.toString(), purpose: 'reverify'}, jti);

        const doc = await DeviceLinkRequest.create({
            jti,
            userId: user._id,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + LINK_TOKEN_EXP_MS),
            used: false,
            clientIp: req.ip,
            userAgent: req.get('User-Agent') || ''
        });
        res.json({ success: true, data: { reverifyToken: token, expiresInMs: LINK_TOKEN_EXP_MS }});
    }catch (err) {
        console.error('requirePasswordReverify', err);
        res.status(500).json({ success: false, message: 'server error '});
    }
}

async function createLinkRequest(req, res)  {
    try {
        const user = req.user;
        const reverifyToken = req.headers['x-reverify-token'] || req.body.reverifyToken;
        if(!reverifyToken) return res.status(401).json({ success: false, message: 'reverify required '});

        let payload;
        try{
            payload = verifyLinkToken(reverifyToken);
        }catch (e) {
            return res.status(401).json({ success: false, message: 'invalid or expired reverify token '});
        }
        if (payload.userId !== user._id.toString() || payload.purpose !== 'reverify') {
            return res.status(401).json({ success: false, message: 'invalid reverify token payload' });
        }

        // create link token 
        const jti = generateJti();
        const linkPayload = { userId: user._id.toString(), purpose: 'device-link' };
        const linkToken = signLinkToken(linkPayload, jti);
        const expiresAt = new Date(Date.now() + LINK_TOKEN_EXP_MS);

        // persist link request
        await DeviceLinkRequest.create({
            jti,
            userId: user._id,
            createdAt: new Date(),
            expiredAt,
            used: false, 
            clientIp: req.ip,
            userAgent: req.get('User-Agent') || ''
        });

        const qrData = await qrcode.toDataURL(linkToken);

        res.json({
            success: true,
            data: {
              linkToken, // short-lived JWT
              qrData,    // data URL for QR image
              expiresAt
            }
          });
        } catch (err) {
          console.error('createLinkRequest', err);
          res.status(500).json({ success: false, message: 'server error' });
    }
}

async function completeLinking(req, res) {
    try{
        const { linkToken, deviceToken } = req.body;
        if(!linkToken) return res.status(400).json({ success: false, message: 'linkToken required '});

        let payload;
        try{
            payload = verifyLinkToken(linkToken);
        }catch (err) {
            return res.status(401).json({ success: false, message: 'invalid or expired link token' });
        }
        if (payload.purpose !== 'device-link') {
            return res.status(401).json({ success: false, message: 'invalid token purpose' });
        }

        const jti = payload.jti || (payload && payload?.jti) || null;

        if(!jti) {
            const decoded = jwt.decode(linkToken, { complete: false });
            if (decoded && decoded.jti) payload.jti = decoded.jti;
        }

        const tokenJti = payload.jti;
        if(!tokenJti) {
            return res.status(400).json({ success: false, message: 'token missing id '});
        }

        const reqDoc = await DeviceLinkRequest.findOne({ jti: tokenJti });
        if (!reqDoc) return res.status(400).json({ success: false, message: 'link request not found' });
        if (reqDoc.used) return res.status(400).json({ success: false, message: 'link token already used' });
        if (reqDoc.expiresAt.getTime() < Date.now()) return res.status(400).json({ success: false, message: 'link token expired' });
    
        // Create deviceId and deviceKey
        const deviceKey = generateDeviceKey();
        const deviceKeyHash = hashDeviceKey(deviceKey);
        const deviceId = 'ec-dev-' + require('crypto').randomBytes(10).toString('hex');
    
        const name = (deviceInfo && deviceInfo.name) || `Device-${deviceId.slice(-6)}`;
    
        // create device document
        const deviceDoc = await Device.create({
          deviceId,
          userId: reqDoc.userId,
          name,
          os: deviceInfo?.os || '',
          specs: deviceInfo?.specs || {},
          deviceKeyHash,
          isRevoked: false,
          lastSeen: null
        });    
    }catch (err) {
        console.error('completeLinking', err);
        res.status(500).json({ success: false, message: 'server error' });
    }
}
async function listDevice(req, res) {
    try {
        const user = req.user;
        const devices = await Device.find({ userId: user._id }).select('-deviceKeyHash').lean().sort({ createdAt: -1 });
        res.json({ success: true, data: devices });
    }catch (err) {
        console.error('listDevices', err);
        res.status(500).json({ success: false, message: 'server error '});
    }
}

async function revokeDevice(req, res) {
    try {
        const user = req.user;
        const { deviceId } = req.params;
        const device = await Device.findOne({ deviceId, userId: user._id});
        if(!device) return res.status(400).json({ success: false, message: 'device not found' });
        device.isRevoked = true;
        await device.save();
        res.json({ success: true, message: 'device revoked' });
    }catch (err) {
        console.error('revokeDevice', err);
        res.status(500).json({ success: false, message: 'server error' });
    }
}

async function renameDevice(req, res) {
    try {
        const user = req.user;
        const { deviceId } = req.params;
        const { name } = req.body;
        if(!name) return res.status(400).json({ success: false, message: 'name required '});

        const device = await Device.findOneAndUpdate({ deviceId, userId: user._id }, { $set: { name } }, { new: true });
        if (!device) return res.status(404).json({ success: false, message: 'device not found' });
        res.json({ success: true, data: { deviceId: device.deviceId, name: device.name } });
    } catch (err) {
        console.error('renameDevice', err);
        res.status(500).json({ success: false, message: 'server error' });
    }
}

module.exports = {
    requirePasswordReverify,
    createLinkRequest,
    completeLinking,
    listDevice,
    revokeDevice,    
    renameDevice
};