import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Stop retrying repeatedly if Redis is not installed
  });

  // CRITICAL: Attach error listener to prevent Node.js unhandled EventEmitter error crashes
  redis.on('error', (err) => {
    fastify.log.warn({ err: err.message }, 'Redis offline or unreachable, operating in standalone mode');
  });

  try {
    await redis.connect();
    fastify.log.info('Redis connected successfully');
  } catch (err: any) {
    fastify.log.warn('Redis connection failed, continuing with in-memory fallback');
  }

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    try {
      await redis.quit();
    } catch {
      // Ignore cleanup error if already disconnected
    }
  });
};

export default fp(redisPlugin);
