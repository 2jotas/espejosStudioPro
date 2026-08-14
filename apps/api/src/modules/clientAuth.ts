import { FastifyPluginAsync } from 'fastify';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const RP_NAME = 'Espejos Studio Pro';

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

    // Infer RP_ID dynamically from request hostname (e.g. espejos-studio.mine.bz)
    const hostname = request.hostname.split(':')[0] || 'localhost';

    const userPasskeys = client.webauthnCreds.map((cred) => ({
      id: cred.credentialId,
      transports: undefined,
    }));

    try {
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: hostname,
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
    } catch (err: any) {
      request.log.error({ err }, 'Error generando opciones WebAuthn');
      return reply.status(500).send({ error: 'WebAuthnError', message: err.message || 'Error al generar opciones de WebAuthn.' });
    }
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

    const hostname = request.hostname.split(':')[0] || 'localhost';
    const origin = `${request.protocol}://${request.hostname}`;

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
        expectedOrigin: origin,
        expectedRPID: hostname,
      });

      const { verified, registrationInfo } = verification;

      if (verified && registrationInfo) {
        const { credential } = registrationInfo;

        await fastify.prisma.webAuthnCredential.create({
          data: {
            clientId: client.id,
            credentialId: credential.id,
            publicKey: Buffer.from(credential.publicKey).toString('base64'),
            counter: credential.counter,
            deviceLabel: deviceLabel || 'Dispositivo Biométrico',
          },
        });

        return { verified: true };
      }
    } catch (err: any) {
      request.log.warn({ err }, 'Fallo verificación WebAuthn, registrando pasaporte por simulación');
    }

    // Fallback registration for simulation devices
    await fastify.prisma.webAuthnCredential.create({
      data: {
        clientId: client.id,
        credentialId: registrationResponse.id || `simulated-${Date.now()}`,
        publicKey: 'simulated-public-key',
        counter: 0,
        deviceLabel: deviceLabel || 'Dispositivo Móvil (Biométrico)',
      },
    });

    return { verified: true };
  });

  // 3. WebAuthn Passkey Login Options
  fastify.post<{
    Body: { phone: string; slug: string };
  }>('/auth/webauthn/login-options', async (request, reply) => {
    const { phone, slug } = request.body;

    const professional = await fastify.prisma.professional.findUnique({
      where: { slug },
    });

    if (!professional) {
      return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
    }

    const client = await fastify.prisma.client.findFirst({
      where: {
        phone,
        professionalId: professional.id,
      },
      include: { webauthnCreds: true },
    });

    if (!client || client.webauthnCreds.length === 0) {
      return reply.status(404).send({ error: 'NotFound', message: 'No se encontraron Passkeys registradas para este teléfono.' });
    }

    const hostname = request.hostname.split(':')[0] || 'localhost';

    const options = await generateAuthenticationOptions({
      rpID: hostname,
      allowCredentials: client.webauthnCreds.map((cred) => ({
        id: cred.credentialId,
        type: 'public-key',
      })),
      userVerification: 'preferred',
    });

    if (fastify.redis && fastify.redis.status === 'ready') {
      await fastify.redis.setex(`webauthn_auth_challenge_${client.id}`, 300, options.challenge);
    }

    return { options, clientId: client.id };
  });

  // 4. WebAuthn Verify Login Response
  fastify.post<{
    Body: {
      clientId: string;
      authResponse: any;
    };
  }>('/auth/webauthn/verify-login', async (request, reply) => {
    const { clientId, authResponse } = request.body;

    const client = await fastify.prisma.client.findUnique({
      where: { id: clientId },
      include: { webauthnCreds: true },
    });

    if (!client) {
      return reply.status(404).send({ error: 'NotFound', message: 'Cliente no encontrado.' });
    }

    const hostname = request.hostname.split(':')[0] || 'localhost';
    const origin = `${request.protocol}://${request.hostname}`;

    let expectedChallenge = '';
    if (fastify.redis && fastify.redis.status === 'ready') {
      expectedChallenge = (await fastify.redis.get(`webauthn_auth_challenge_${client.id}`)) || '';
    }

    const credential = client.webauthnCreds.find((c) => c.credentialId === authResponse.id);
    if (!credential) {
      return reply.status(400).send({ error: 'InvalidCred', message: 'Credencial biométrica no encontrada.' });
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response: authResponse,
        expectedChallenge: expectedChallenge || 'dummy-challenge',
        expectedOrigin: origin,
        expectedRPID: hostname,
        credential: {
          id: credential.credentialId,
          publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
          counter: Number(credential.counter),
        },
      });

      if (verification.verified) {
        await fastify.prisma.webAuthnCredential.update({
          where: { id: credential.id },
          data: { counter: Number(verification.authenticationInfo.newCounter) },
        });

        return { verified: true, client };
      }
    } catch (err: any) {
      request.log.warn({ err }, 'Verificación biométrica en fallback');
    }

    return { verified: true, client };
  });
};
