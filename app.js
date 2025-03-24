require('dotenv').config(); // load .env
const Redis = require('ioredis');
const moment = require('moment');

const sentinelStr = process.env.REDIS_SENTINELS || '';
const masterName = process.env.REDIS_MASTER_NAME || 'mymaster';

const sentinelNodes = sentinelStr.split(',').map((node) => {
  const [host, port] = node.split(':');
  return { host, port: parseInt(port, 10) };
});

// 建立 Redis 客戶端（自動連到 master）
let redis = new Redis({
  sentinels: sentinelNodes,
  name: masterName,
  // role: 'master',
  retryStrategy: (times) => {
    console.log(`🔁 Redis 連線重試中（第 ${times} 次）`);
    return Math.min(times * 1000, 5000);
  },
});

redis.on('connect', () => {
  console.log('✅ 已連線到 Redis master');
});

redis.on('error', (err) => {
  console.error('❌ Redis 錯誤：', err.message);
});

let counter = 0;

const writeData = async () => {
  const timestamp = moment().format('YYYYMMDD-HHmmss');
  const key = `test:${timestamp}:${counter}`;
  const value = Math.floor(Math.random() * 10000);

  try {
    await redis.set(key, value);
    console.log(`[寫入成功] ${key} -> ${value}`);
    counter++;
  } catch (err) {
    console.error(`⚠️ 寫入失敗：${err.message}`);
  }
};

setInterval(writeData, 1000);
