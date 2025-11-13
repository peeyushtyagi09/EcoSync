const { validationResult } = require('express-validator');
const User = require("../models/User");

async function getProfile(req, res) {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = req.user;
        res.json({
            success: true, 
            data: {
                id: user._id, 
                username: user.username, 
                email: user.email, 
                walletAddress: user.walletAddress,
                totalTokens: user.totalTokens, 
                createdAt: user.createdAt,
            }
        });
    }catch (err) {
        console.error('user.getProfile', err);
        res.status(500).json({ success: false, message: 'server error '});
    }
}

async function updateProfile(req, res) {
    try {
        const allowed = ['username', 'walletAddress'];
        const payload = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) payload[k] = req.body[k]; });

        if(Object.keys(payload).length === 0){
            return res.status(400).json({ success: false, message: 'no fields to update' });
        }
        const user = await User.findByIdAndUpdate(req.user._id, { $set: payload }, { new: true }).select('-passwordHash');
        res.json({ success: true, data: { id: user._id, username: user.username, walletAddress: user.walletAddress }});
      } catch (err) {
        console.error('user.updateProfile', err);
        // handle unique index errors
        if (err.code === 11000) {
          return res.status(409).json({ success: false, message: 'value already in use' });
        }
        res.status(500).json({ success: false, message: 'server error' });
      }
    }
    
module.exports = {
    getProfile,
    updateProfile
};