const mongoose = require("mongoose");

const MetricSchema = new mongoose.Schema({
    metricId: {type: Sting, required: true, unique: true},
    deviceId: {type: String, required: true, unqiue: true},
    timestamp: {timestamp: true},
    cpuUsage: {type: Number},
    memoryUsage: {type: Number},
    diskUsage: {
        usedGB: Number,
        freeGB: Number,
    }, 
    networkUsage: {
        uploadKbps: Number,
        downloadKBps: Number,
    },
    powerUsage: {
        watts: Number,
    },
    temprature: {
        cpuTemprature: Number,
        gpuTemprature: Number,
    },
    idleState: Boolean,
});
module.exports = mongoose.model("Metrics", MetricSchema);