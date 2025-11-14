const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, default: 'Unnamed Device' },
  os: {type: String, default: '' },
  specs: { type: Object, default: {} },
  deviceKeyHash: { type: String, required: true },
  isRevoked: { type: Boolean, default: false },
  lastSeen: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true});

module.exports = mongoose.model('Device', DeviceSchema);