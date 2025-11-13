const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    deviceId: { type:String, required: true, unique: true, index: true},
    name: {type: String, required: true, trim: true},
    ipAddress: {
      type: String,
      required: true, 
      validate: {
        validator: v => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(v),
        message: props => `${props.value} is not a valid IP address`,
      },
    },
    osType: {type: String, trim: true},
    osVersion: {type: String, trim: true},
    cpu: {
        cores: {type: Number, min: 1},
        model: {type: String, trim: true},
        speedGHz: { type: Number, min: 0},
      },
      ram: {type: Number, min: 0, required: true}, // in MB
      disk: {
        totalGB: {type: Number, min: 0, required: true},
        freeGB: {type: Number, min: 0, required: true},
      },
      owner: {type: String, trim: true},
    registeredAt: {type: Date, default: Date.now},
    lastActiveAt: {type: Date, default: Date.now},
    status: { type: String, enum: ["online", "offline"], default: "offline"},
}, {timestamps: true});

// Keep lastActiveAt updated
deviceSchema.pre("save", function (next) {
  this.lastActiveAt = new Date();
  next();
});

module.exports = mongoose.model('Device', deviceSchema);