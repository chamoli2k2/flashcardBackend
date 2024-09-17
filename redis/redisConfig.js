import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();


const redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST_NAME,
        port: process.env.REDIS_PORT
    }
});


redisClient.on('connect', () => {
    console.log('Connected to Redis on Render');
});

redisClient.on('ready', () => {
    console.log('Redis client is ready');
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisClient.on('end', () => {
    console.log('Redis client has disconnected');
});

await redisClient.connect().catch(console.error);

export default redisClient;
