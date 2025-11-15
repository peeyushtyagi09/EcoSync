const Device = require('../models/Device');
const { hashDeviceKey } = require('../utils/linkToken');

async function deviceAuthMiddleware(req, res, next) {
    try{
        const header = req.headers.authorization;
        if(!header || !header.startsWith('Device ')){
            return res.status(401).json({ success: false, message: 'device authorization required'})
        } 
        const deviceKey = header.split(' ')[1];
        if(!deviceKey) return res.status(401).json({ success: false, message: 'invalid device Key'});
        const device = await Device.findOne({ deviceKeyHash: keyHash}).populate('userId', 'username email');
        if(!device) return res.status(401).json({ success: false, message: 'unknown device '});
        if(device.isRevoked) return res.status(403).json({ success: false, message: 'device revoked'})

        req.device = device;
        req.user = device.userId;
        device.lastSeen = new Date();
        device.save().catch(() => {});
        next();
    }catch (err) {
        console.error('deviceAuthMiddleware', err);
        res.status(401).json({ success: false, message: 'device auth failed'});
    }
}
module.exports = deviceAuthMiddleware;