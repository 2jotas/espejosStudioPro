import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import prismaPlugin from '../apps/api/src/plugins/prisma.js';
import redisPlugin from '../apps/api/src/plugins/redis.js';
import { authRoutes } from '../apps/api/src/modules/auth.js';
import { superAdminRoutes } from '../apps/api/src/modules/superAdmin.js';

async function testAuth() {
  const app = Fastify();
  await app.register(cors);
  await app.register(cookie);
  await app.register(jwt, { secret: 'test-secret-key-123' });
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(superAdminRoutes, { prefix: '/api' });

  await app.ready();

  console.log('🧪 Starting Auth Tests...\n');

  // Test 1: Login with email
  const res1 = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: '2jota27@gmail.com', password: 'Password123!' },
  });
  console.log('Test 1 (Login with Email 2jota27@gmail.com):', res1.statusCode, res1.json());

  // Test 2: Login with slug "john"
  const res2 = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'john', password: 'Password123!' },
  });
  console.log('Test 2 (Login with Slug "john"):', res2.statusCode, res2.json());

  // Test 3: Login with email "admin@espejos.cl"
  const res3 = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'admin@espejos.cl', password: 'Admin123!' },
  });
  console.log('Test 3 (Login with Email admin@espejos.cl):', res3.statusCode, res3.json());

  // Test 4: Login with slug "admin"
  const res4 = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'admin', password: 'Admin123!' },
  });
  console.log('Test 4 (Login with Slug "admin"):', res4.statusCode, res4.json());

  // Test 5: Forgot Password PIN Generation
  const res5 = await app.inject({
    method: 'POST',
    url: '/api/auth/forgot-password',
    payload: { email: '2jota27@gmail.com' },
  });
  const data5 = res5.json();
  console.log('Test 5 (Forgot Password PIN):', res5.statusCode, data5);

  if (data5.verificationCode) {
    // Test 6: Reset Password with PIN
    const res6 = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { email: '2jota27@gmail.com', code: data5.verificationCode, newPassword: 'Password123!' },
    });
    console.log('Test 6 (Reset Password with PIN):', res6.statusCode, res6.json());
  }

  await app.close();
}

testAuth().catch(console.error);
