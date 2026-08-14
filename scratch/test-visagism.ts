import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import prismaPlugin from '../apps/api/src/plugins/prisma.js';
import redisPlugin from '../apps/api/src/plugins/redis.js';
import { visagismRoutes } from '../apps/api/src/modules/visagism.js';

async function testVisagism() {
  const app = Fastify();
  await app.register(cors);
  await app.register(multipart);
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(visagismRoutes, { prefix: '/api' });

  await app.ready();

  console.log('🧪 Testing Visagism AI Module Routes...\n');

  // Test 1: Visagism Analysis with simulated multipart image
  // Create a valid 1x1 JPEG buffer
  const sampleJpegBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');

  const boundary = '--------------------------123456789012345678901234';
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="face.jpg"',
    'Content-Type: image/jpeg',
    '',
    sampleJpegBuffer.toString('binary'),
    `--${boundary}`,
    'Content-Disposition: form-data; name="ageGroup"',
    '',
    '26-35',
    `--${boundary}`,
    'Content-Disposition: form-data; name="occupation"',
    '',
    'Creativo / Urbano',
    `--${boundary}`,
    'Content-Disposition: form-data; name="maintenanceTime"',
    '',
    '5-10m',
    `--${boundary}--`,
  ].join('\r\n');

  const res = await app.inject({
    method: 'POST',
    url: '/api/visagism/analyze',
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
    payload: Buffer.from(body, 'binary'),
  });

  console.log('Test 1 (Visagism Analyze Status):', res.statusCode);
  const data = res.json();
  console.log('Visagism Analysis Result:', {
    forma_rostro: data.forma_rostro,
    tipo_cabello: data.tipo_cabello,
    tono_piel: data.tono_piel,
    recomendacionesCount: data.recomendaciones?.length,
    primeraRecomendacion: data.recomendaciones?.[0]?.nombre_corte,
  });

  await app.close();
}

testVisagism().catch(console.error);
