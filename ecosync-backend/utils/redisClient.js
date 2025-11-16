const Redis = require("ioredis");

const REDIS_URL = process.env.REDIUS_URL || 'redius://localhost:6379';
const redis = new Redis(REDIS_URL);

redis.on('error', (e) => console.error('Redi error', e));
redis.on('connecct', () => console.log('Redis connected to', REDIS_URL));

module.exports = redis;

