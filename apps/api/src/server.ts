import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import prismaPlugin from './plugins/prisma.js';
import redisPlugin from './plugins/redis.js';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { healthRoutes } from './modules/health.js';
import { authRoutes } from './modules/auth.js';
import { serviceRoutes } from './modules/services.js';
import { clientRoutes } from './modules/clients.js';
import { calendarRoutes } from './modules/calendar.js';
import { appointmentRoutes } from './modules/appointments.js';
import { clientAuthRoutes } from './modules/clientAuth.js';
import { galleryRoutes } from './modules/gallery.js';
import { planRoutes } from './modules/plans.js';
import { initializeGalleryWatcher } from './lib/galleryWatcher.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), './.env') });

const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

const server = Fastify({
  logger: true,
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

  await server.register(fastifyMultipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  await server.register(fastifyStatic, {
    root: path.resolve(process.cwd(), './uploads'),
    prefix: '/uploads/',
  });

  await server.register(prismaPlugin);
  await server.register(redisPlugin);

  // Register routes
  await server.register(healthRoutes);
  await server.register(authRoutes, { prefix: '/api' });
  await server.register(serviceRoutes, { prefix: '/api' });
  await server.register(clientRoutes, { prefix: '/api' });
  await server.register(calendarRoutes, { prefix: '/api' });
  await server.register(appointmentRoutes, { prefix: '/api' });
  await server.register(clientAuthRoutes, { prefix: '/api' });
  await server.register(galleryRoutes, { prefix: '/api' });
  await server.register(planRoutes, { prefix: '/api' });

  // Initialize file watcher for auto-publishing photos
  initializeGalleryWatcher(server.prisma);

  try {
    await server.listen({ port, host });
    server.log.info(`🚀 API Server running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
