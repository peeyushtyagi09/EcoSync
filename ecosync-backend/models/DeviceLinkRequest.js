const mongoose = require("mongoose");

const DeviceLinkRequestSchema = new mongoose.Schema({
    jti: { type: String, required: true, unique: true, index: true},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},
    createdAt: {type: Date, default: Date.now, index: true},
    expiredAt: { type: Date, required: true, index: true},
    used: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
    clientIp: { type:String, default: null},
    userAgent: { type: String, default: null }
});

module.exports = mongoose.model('DeviceLinkRequest', DeviceLinkRequestSchema);