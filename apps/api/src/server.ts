import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import prismaPlugin from './plugins/prisma.js';
import redisPlugin from './plugins/redis.js';
import { healthRoutes } from './modules/health.js';

dotenv.config();

const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

async function main() {
  await server.register(cors, {
    origin: true,
    credentials: true,
  });

  await server.register(cookie);

  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-espejos-2026',
  });

  await server.register(prismaPlugin);
  await server.register(redisPlugin);

  // Register routes
  await server.register(healthRoutes);

  try {
    await server.listen({ port, host });
    server.log.info(`🚀 API Server running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
