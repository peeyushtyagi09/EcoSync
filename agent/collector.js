// agent/src/collector.js
require('dotenv').config();
const si = require('systeminformation');
const io = require('socket.io-client');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { computeRawScore, applyEma } = require('../backend/src/utils/energyScore'); // reuse server util path if repo structure allows. Alternatively re-implement below.

const CONFIG_PATH = path.join(os.homedir(), '.ecosync', 'config.json');
const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';
const METRICS_INTERVAL_MS = parseInt(process.env.METRICS_INTERVAL_MS || '5000', 10);
const EMA_ALPHA = 0.3;

if (!fs.existsSync(CONFIG_PATH)) {
  console.error('Missing config at', CONFIG_PATH, '— run device linking first.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const deviceKey = config.deviceKey;
const deviceId = config.deviceId;
if (!deviceKey || !deviceId) {
  console.error('deviceKey/deviceId missing in config');
  process.exit(1);
}

const namespaceUrl = (BACKEND.replace(/\/$/, '') + '/ecosync');
const socket = io(namespaceUrl, {
  auth: { authorization: `Device ${deviceKey}` },
  extraHeaders: { Authorization: `Device ${deviceKey}` },
  reconnectionAttempts: 5,
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected to backend as', deviceId, 'socket', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket connect_error', err && err.message);
});

socket.on('metrics_ack', (data) => {
  // optional: receive server ack
});

let prevScore = null;

async function collectOnce() {
  try {
    const cpuLoad = await si.currentLoad();
    const mem = await si.mem();
    const tempObj = await si.cpuTemperature();
    const battery = await si.battery();

    // process snapshot - top processes by cpu
    let processes = [];
    try {
      const procs = await si.processes();
      if (procs && procs.list) {
        processes = procs.list
          .sort((a, b) => b.cpu - a.cpu)
          .slice(0, 5)
          .map(p => ({ pid: p.pid, name: p.name, cpu: Number(p.cpu.toFixed(2)), mem: Number(p.mem.toFixed(2)) }));
      }
    } catch (e) {
      processes = [];
    }

    const metrics = {
      cpu: Number(cpuLoad.currentLoad.toFixed(2)),
      memUsed: mem.used,
      memTotal: mem.total,
      temp: tempObj && tempObj.main != null ? Number(tempObj.main.toFixed(1)) : null,
      batteryPercent: battery && battery.hasbattery ? battery.percent : null,
      plugged: battery && battery.ischarging ? true : false,
      processes
    };

    // compute local raw score using same algorithm as server util
    const raw = computeRawScore({ cpu: metrics.cpu, temp: metrics.temp, batteryPercent: metrics.batteryPercent });
    const score = applyEma(prevScore, raw, EMA_ALPHA);
    prevScore = score;

    const payload = {
      deviceId,
      timestamp: new Date().toISOString(),
      metrics,
      energyScore: Number(score.toFixed(2))
    };

    // emit metrics with small size; processes trimmed
    socket.emit('metrics', payload);
  } catch (err) {
    console.error('collect error', err && err.message);
  }
}

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected', reason);
});

// start loop after connected
socket.on('connect', () => {
  collectOnce(); // immediate
  setInterval(collectOnce, METRICS_INTERVAL_MS);
});
