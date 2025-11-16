const Device = require('../models/Device');
const jwt = require('jsonwebtoken');
const { handleIncomingMetrics } = require('../services/metricsService');
const redis = require('../utils/redisClient');

const RATE_LIMIT_MS = 1000;
module.exports = function initMerticsNamespace(nsp) {
    nsp.use(async (socket, next) => {
        try {
            const suth = socket.handshake.auth || {};
            const header = (socket.handshake.headers['authorization'] || auth.authorization || auth.deviceAuthorization || '').toString();
            if(!header || !header.startsWith('Device ')) return next(new Error('Device auth required')); 
        }
    })
}