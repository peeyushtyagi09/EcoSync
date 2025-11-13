const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },   // ✅ keep this exact
    createdAt: { type: Date, default: Date.now },
    replacedByTokenHash: { type: String, default: null },
    revokedAt: { type: Date, default: null },
    createdByIp: { type: String, default: null },
    revokedByIp: { type: String, default: null }
  });
  
  RefreshTokenSchema.virtual('isExpired').get(function () {
    return !this.expiresAt ? true : Date.now() >= this.expiresAt.getTime();
  });
  
  RefreshTokenSchema.methods.isActive = function () {
    return !this.revokedAt && !this.isExpired;
  };
  
  module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
  