const Queue = require("bull");

const chunkQueue = new Queue("chunkQueue", {
    redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
});

chunkQueue.on('error', (error) => {
    console.error('Error connecting to Redis:', error);
});

chunkQueue.on('ready', () => {
    console.log('Connected to Redis and ready to process jobs.');
});

const fileQueue = new Queue("fileQueue", {
    redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
});

module.exports = {chunkQueue, fileQueue};