import redis from 'redis'
import config from './environment.js'

export const client = redis.createClient({
    url: config.REDIS_URL
})

client.on('error', (err) => {
    console.log('Redis connection error:', err)
})

client.on('connect', () => {
    console.log('Redis connected')
})

export async function connectRedis() {
    try {
        await client.connect();
    } catch (error) {
        console.log('Redis connection error:', error)
        process.exit(1)
    }
}
