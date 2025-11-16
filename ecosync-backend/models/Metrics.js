const mongoose = require('mongoose');

const MetricsSchema = new mongoose.Schema({
    deviceId: {type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    cpu: {type: Number, required: true },
    memUsed: { type: Number},
    memTotal: { type: Number},
    temp: {type: Number},
    batteryPercent: {type: Number}, 
    plugged: { type: Boolean}, 
    energyScore: { type: Number} 
}, { timestamp: false });
module.exports = mongoose.model('Metrics', MetricsSchema);