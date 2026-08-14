import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import prismaPlugin from '../apps/api/src/plugins/prisma.js';
import redisPlugin from '../apps/api/src/plugins/redis.js';
import { dashboardRoutes } from '../apps/api/src/modules/dashboard.js';
import { authRoutes } from '../apps/api/src/modules/auth.js';

async function testDashboard() {
  const app = Fastify();
  await app.register(cors);
  await app.register(cookie);
  await app.register(jwt, { secret: 'test-secret-key-123' });
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });

  await app.ready();

  console.log('🧪 Starting Dashboard Analytics API Tests...\n');

  // 1. Authenticate as john
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'john', password: 'Password123!' },
  });
  const token = loginRes.json().token;
  console.log('✅ Authenticated token received for John');

  // 2. Test timeframe: today
  const resToday = await app.inject({
    method: 'GET',
    url: '/api/dashboard/stats?timeframe=today',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Test 1 (Dashboard stats timeframe=today):', resToday.statusCode, resToday.json().metrics);

  // 3. Test timeframe: month
  const resMonth = await app.inject({
    method: 'GET',
    url: '/api/dashboard/stats?timeframe=month',
    headers: { Authorization: `Bearer ${token}` },
  });
  const monthData = resMonth.json();
  console.log('Test 2 (Dashboard stats timeframe=month):', resMonth.statusCode, monthData.metrics);
  console.log('Top Services Pareto:', monthData.topServices);

  await app.close();
}

testDashboard().catch(console.error);
