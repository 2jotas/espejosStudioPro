import { FastifyReply, FastifyRequest } from 'fastify';
import { UserSession } from '@espejos/shared-types';

declare module 'fastify' {
  interface FastifyRequest {
    userSession?: UserSession;
  }
}

export async function authenticateProfessional(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies && request.cookies.token) {
      token = request.cookies.token;
    }

    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'No authentication token provided' });
    }

    const decoded = request.server.jwt.verify<UserSession>(token);
    request.userSession = decoded;
    (request as any).user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired authentication token' });
  }
}
