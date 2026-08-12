import { FastifyPluginAsync } from 'fastify';
import { HealthCheckResponse } from '@espejos/shared-types';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (): Promise<HealthCheckResponse> => {
    let dbStatus = 'disconnected';
    let redisStatus = 'disconnected';

    try {
      await fastify.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'error';
    }

    try {
      if (fastify.redis && fastify.redis.status === 'ready') {
        await fastify.redis.ping();
        redisStatus = 'connected';
      }
    } catch (e) {
      redisStatus = 'error';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    };
  });
};
