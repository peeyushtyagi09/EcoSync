const redis = require('../utils/redisClient');
const { computeRawScore, applyEma} = require('../utils/energyScore');

const METRICS_TTL = 75;
const METRICS_BUFFER_KEY = 'metrics:buffer';
const ENERGY_RANK_KEY = 'energy:rank';
const ANOMALY_THRESHOLD = Number(process.env.ENERGY_ANOMALY_THRESHOLD || 20);

function validateMetricsPayload(payload) {
    if(!payload || !payload.deviceId || !payload.metrics) return false;
    const m = payload.merics;
    if(typeof m.cpu !== 'number') return false;
    if(m.temp != null && typeof m.temp !== 'number') return false;
    if(m.batteryPercent != null && typeof m.batteryPercent !== 'number') return false;
    return true;
}

async function handleIncomingMetrics(device, payload) {
    if(!validateMetricsPayload(payload)) {
        throw new Error('invalid metrics payload');
    }
    const p = payload.metrics;
    const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

    const serverRaw = computeRawScore({ cpu: p.cpu, temp: p.temp, batteryPercent: p.batteryPercent});

    const prevScoreRaw = await redis.get(`device:${device.deviceId}:score`);
    const prevScore = prevScoreRaw ? Number(prevScoreRaw) : null;
    const serverScore = applyEma(prevScore, serverRaw, 0.3);

    let anomaly = false;
    if(typeof payload.energyScore === 'number'){
        const diff = Math.abs(payload.energyScore - serverScore);
        if (diff > ANOMALY_THRESHOLD) anomaly = true;
    }

    const snapshot = {
        deviceId: device.deviceId, 
        timestamp: timestamp.toISOString(), 
        cpu: p.cpu, 
        memUsed: p.memUsed || null, 
        memTotal: p.memTotal || null, 
        temp: p.temp || null, 
        batteryPercent: p.batteryPercent || null, 
        plugged: !!p.plugged,
        energyScore: serverScore, 
        anomaly
    };
    // store latest snapshot in Redis (TTL)
  await redis.set(`device:${device.deviceId}:latest`, JSON.stringify(snapshot), 'EX', METRICS_TTL);

  // update energy ranking (lower score => better)
  // We'll store score as score in sorted set; smaller is better so use score directly.
  await redis.zadd(ENERGY_RANK_KEY, serverScore, device.deviceId);
  await redis.set(`device:${device.deviceId}:score`, String(serverScore), 'EX', METRICS_TTL);

  // push raw metrics to buffer for batch persistence
  await redis.lpush(METRICS_BUFFER_KEY, JSON.stringify({
    deviceId: device.deviceId,
    timestamp: timestamp.toISOString(),
    cpu: p.cpu,
    memUsed: p.memUsed || null,
    memTotal: p.memTotal || null,
    temp: p.temp || null,
    batteryPercent: p.batteryPercent || null,
    plugged: !!p.plugged,
    energyScore: serverScore
  }));

  // keep a metric indicating device lastSeen separately
  await redis.set(`device:${device.deviceId}:lastSeen`, Date.now(), 'EX', METRICS_TTL * 2);

  return { snapshot, anomaly };
}

module.exports = { handleIncomingMetrics, METRICS_BUFFER_KEY };