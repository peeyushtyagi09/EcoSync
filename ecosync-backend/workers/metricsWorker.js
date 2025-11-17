// backend/src/workers/metricsWorker.js
require('dotenv').config();
const mongoose = require('mongoose');
const redis = require('../utils/redisClient');
const Metrics = require('../models/Metrics');

const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecosync';
const BUFFER_KEY = 'metrics:buffer';
const BATCH_SIZE = parseInt(process.env.METRICS_BATCH_SIZE || '300', 10);
const FLUSH_MS = parseInt(process.env.METRICS_BATCH_FLUSH_MS || '60000', 10);

async function connect() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Worker connected to mongo');
}

async function popBatch() {
  const batch = [];
  for (let i = 0; i < BATCH_SIZE; i++) {
    const item = await redis.rpop(BUFFER_KEY);
    if (!item) break;
    try {
      const json = JSON.parse(item);
      batch.push({
        deviceId: json.deviceId,
        timestamp: new Date(json.timestamp),
        cpu: json.cpu,
        memUsed: json.memUsed,
        memTotal: json.memTotal,
        temp: json.temp,
        batteryPercent: json.batteryPercent,
        plugged: json.plugged,
        energyScore: json.energyScore
      });
    } catch (err) {
      console.error('Malformed JSON in buffer', err);
    }
  }
  return batch;
}

async function runLoop() {
  while (true) {
    try {
      const batch = await popBatch();
      if (batch.length > 0) {
        await Metrics.insertMany(batch, { ordered: false });
        console.log(`Worker: inserted ${batch.length} metrics to Mongo`);
      } else {
        // sleep FLUSH_MS (or shorter) when no data
        await new Promise(r => setTimeout(r, FLUSH_MS));
      }
    } catch (err) {
      console.error('Worker error', err);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

(async () => {
  try {
    await connect();
    console.log('Metrics worker started');
    runLoop();
  } catch (err) {
    console.error('Worker startup failed', err);
    process.exit(1);
  }
})();
