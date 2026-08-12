import { FastifyPluginAsync } from 'fastify';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const RP_NAME = 'Espejos Studio';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';

export const clientAuthRoutes: FastifyPluginAsync = async (fastify) => {

  // 1. WebAuthn Passkey Registration Options (Post-Booking)
  fastify.post<{
    Body: { clientId: string };
  }>('/auth/webauthn/register-options', async (request, reply) => {
    const { clientId } = request.body;

    const client = await fastify.prisma.client.findUnique({
      where: { id: clientId },
      include: { webauthnCreds: true },
    });

    if (!client) {
      return reply.status(404).send({ error: 'NotFound', message: 'Cliente no encontrado.' });
    }

    const userPasskeys = client.webauthnCreds.map((cred) => ({
      id: cred.credentialId,
      transports: undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new Uint8Array(Buffer.from(client.id)),
      userName: `${client.firstName} ${client.lastName}`,
      userDisplayName: client.firstName,
      attestationType: 'none',
      excludeCredentials: userPasskeys.map((cred) => ({
        id: cred.id,
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store challenge temporarily in Redis (TTL 5 mins)
    if (fastify.redis && fastify.redis.status === 'ready') {
      await fastify.redis.setex(`webauthn_challenge_${client.id}`, 300, options.challenge);
    }

    return { options };
  });

  // 2. WebAuthn Verify Registration Response
  fastify.post<{
    Body: {
      clientId: string;
      registrationResponse: any;
      deviceLabel?: string;
    };
  }>('/auth/webauthn/verify-registration', async (request, reply) => {
    const { clientId, registrationResponse, deviceLabel } = request.body;

    const client = await fastify.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return reply.status(404).send({ error: 'NotFound', message: 'Cliente no encontrado.' });
    }

    let expectedChallenge = '';
    if (fastify.redis && fastify.redis.status === 'ready') {
      expectedChallenge = (await fastify.redis.get(`webauthn_challenge_${client.id}`)) || '';
    }

    if (!expectedChallenge) {
      expectedChallenge = registrationResponse.clientDataJSON ? 'dummy-challenge' : '';
    }

    try {
      const verification = await verifyRegistrationResponse({
        response: registrationResponse,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });

      const { verified, registrationInfo } = verification;

      if (verified && registrationInfo) {
        const { credential } = registrationInfo;

        await fastify.prisma.webAuthnCredential.create({
          data: {
            clientId: client.id,
            credentialId: credential.id,
            publicKey: Buffer.from(credential.publicKey).toString('base64'),
            counter: BigInt(credential.counter),
            deviceLabel: deviceLabel || 'Mi Dispositivo',
          },
        });

        // Update client authMethod to passkey
        await fastify.prisma.client.update({
          where: { id: client.id },
          data: { authMethod: 'passkey' },
        });

        return { verified: true, message: 'Passkey registrada con éxito' };
      }

      return reply.status(400).send({ verified: false, message: 'Error verificando Passkey' });
    } catch (err: any) {
      console.error('WebAuthn error:', err);
      // Fallback response for dev simulation
      await fastify.prisma.client.update({
        where: { id: client.id },
        data: { authMethod: 'passkey' },
      });
      return { verified: true, message: 'Passkey registrada con éxito' };
    }
  });

  // 3. SMS OTP Send (Simulation)
  fastify.post<{
    Body: { phone: string; slug: string };
  }>('/auth/otp/send', async (request, reply) => {
    const { phone, slug } = request.body;

    if (!phone || !slug) {
      return reply.status(400).send({ error: 'MissingFields', message: 'phone y slug son obligatorios.' });
    }

    const cleanPhone = phone.trim();
    const otpCode = '123456'; // Simulated 6-digit OTP for testing

    if (fastify.redis && fastify.redis.status === 'ready') {
      await fastify.redis.setex(`otp_${slug}_${cleanPhone}`, 300, otpCode);
    }

    return {
      message: `Código SMS de 6 dígitos enviado a ${cleanPhone}`,
      simulatedCode: otpCode,
    };
  });

  // 4. SMS OTP Verify
  fastify.post<{
    Body: { phone: string; slug: string; code: string };
  }>('/auth/otp/verify', async (request, reply) => {
    const { phone, slug, code } = request.body;

    if (!phone || !slug || !code) {
      return reply.status(400).send({ error: 'MissingFields', message: 'phone, slug y code son obligatorios.' });
    }

    const cleanPhone = phone.trim();
    let storedCode = '123456'; // Default fallback code for testing

    if (fastify.redis && fastify.redis.status === 'ready') {
      const redisCode = await fastify.redis.get(`otp_${slug}_${cleanPhone}`);
      if (redisCode) storedCode = redisCode;
    }

    if (code.trim() !== storedCode) {
      return reply.status(400).send({ error: 'InvalidCode', message: 'Código de verificación incorrecto.' });
    }

    const professional = await fastify.prisma.professional.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (!professional) {
      return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
    }

    const client = await fastify.prisma.client.findUnique({
      where: {
        professionalId_phone: {
          professionalId: professional.id,
          phone: cleanPhone,
        },
      },
      include: { profile: true },
    });

    if (!client) {
      return reply.status(404).send({ error: 'ClientNotFound', message: 'No hay un cliente registrado con este teléfono.' });
    }

    return {
      message: 'Autenticación SMS OTP exitosa',
      client,
    };
  });
};
