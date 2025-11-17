const Device = require('../models/Device');
const jwt = require('jsonwebtoken');
const { handleIncomingMetrics } = require('../services/metricsService');
const redis = require('../utils/redisClient');
const { hashDeviceKey } = require('../utils/linkToken');

const RATE_LIMIT_MS = 1000;
module.exports = function initMerticsNamespace(nsp) {
    nsp.use(async (socket, next) => {
        try {
            const suth = socket.handshake.auth || {};
            const header = (socket.handshake.headers['authorization'] || auth.authorization || auth.deviceAuthorization || '').toString();
            if(!header || !header.startsWith('Device ')) return next(new Error('Device auth required')); 

            const deviceKey = header.split(' ')[1];

            const keyHash = hashDeviceKey(deviceKey);
            const device = await Device.findOne({ deviceKeyHash: keyHash }).populate('userId', 'username_id');
            if(!device) return next(new Error('Unknown device'));
            if(device.isRevoked) return next(new Error('Device revoked'));

            socket.device = device;
            socket.user = device.userId;

            socket.join(`user:${device.userId._id.toString()}`);
            socket.join(`device:${device.deviceId}`);

            return next();
        }catch(err) {
            console.error('namespace auth err', err);
            return next(new Error('auth error'));
        }
    });

    nsp.on('connection', (socket) => {
        const device = socket.device;
        console.log(`Agent connected: ${device.deviceId} socket ${socket.id}`);

        socket._lastMetricsAt = 0;
        socket.on('metrics', async (payload) => {
            try {
                const new = Date.now();
                if(now - socket._lastMetricsAt < RATE_LIMIT_MS){
                    return;
                }
                socket._lastMetricsAt = now;
                const result = await handleIncomingMetrics(device, payload);

        // emit update to all user's frontends
        nsp.to(`user:${device.userId._id.toString()}`).emit('metrics_update', {
          deviceId: device.deviceId,
          timestamp: result.snapshot.timestamp,
          cpu: result.snapshot.cpu,
          temp: result.snapshot.temp,
          energyScore: result.snapshot.energyScore,
          anomaly: result.snapshot.anomaly
        });

        // optional: ack to agent
        socket.emit('metrics_ack', { ok: true, timestamp: new Date().toISOString() });
      } catch (err) {
        console.error('metrics handler error', err && err.message);
        // optionally emit error to agent
        socket.emit('metrics_error', { message: err.message || 'invalid metrics' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`Agent disconnected: ${device.deviceId} socket ${socket.id} reason=${reason}`);
    });
  });
};