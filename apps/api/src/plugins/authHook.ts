import { FastifyReply, FastifyRequest } from 'fastify';
import { UserSession } from '@espejos/shared-types';

declare module 'fastify' {
  interface FastifyRequest {
    userSession?: UserSession;
  }
}

export async function authenticateProfessional(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.cookies.token;
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'No authentication token provided' });
    }

    const decoded = request.server.jwt.verify<UserSession>(token);
    request.userSession = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired authentication token' });
  }
}
