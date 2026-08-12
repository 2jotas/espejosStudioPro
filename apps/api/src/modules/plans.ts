import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';
import { PLANS, getPlanConfig } from '../lib/plansConfig.js';
import { UserSession } from '@espejos/shared-types';

export const planRoutes: FastifyPluginAsync = async (fastify) => {

  // Public Endpoint: Get all plans definition
  fastify.get('/plans', async () => {
    return { plans: Object.values(PLANS) };
  });

  // Protected Routes Group
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticateProfessional);

    // GET /api/plans/usage - Get professional's current usage vs limits
    protectedRoutes.get('/plans/usage', async (request, reply) => {
      const userSession = request.userSession!;

      const professional = await fastify.prisma.professional.findUnique({
        where: { id: userSession.id },
      });

      if (!professional) {
        return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
      }

      const planConfig = getPlanConfig(professional.plan);

      const servicesCount = await fastify.prisma.service.count({
        where: { professionalId: professional.id, active: true },
      });

      const clientsCount = await fastify.prisma.client.count({
        where: { professionalId: professional.id },
      });

      const galleryCount = await fastify.prisma.galleryImage.count({
        where: { professionalId: professional.id },
      });

      return {
        plan: professional.plan,
        planConfig,
        usage: {
          servicesCount,
          clientsCount,
          galleryCount,
        },
      };
    });

    // POST /api/plans/upgrade - Upgrade or change plan
    protectedRoutes.post<{
      Body: { targetPlan: 'free' | 'pro' };
    }>('/plans/upgrade', async (request, reply) => {
      const userSession = request.userSession!;
      const { targetPlan } = request.body;

      if (!['free', 'pro'].includes(targetPlan)) {
        return reply.status(400).send({ error: 'InvalidPlan', message: 'Plan no válido.' });
      }

      const updatedProfessional = await fastify.prisma.professional.update({
        where: { id: userSession.id },
        data: {
          plan: targetPlan,
          planExpiresAt: targetPlan === 'pro' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        },
      });

      const updatedSession: UserSession = {
        id: updatedProfessional.id,
        email: updatedProfessional.email,
        slug: updatedProfessional.slug,
        businessName: updatedProfessional.businessName,
        plan: updatedProfessional.plan as 'free' | 'pro',
      };

      // Re-sign JWT token cookie
      const token = fastify.jwt.sign(updatedSession, { expiresIn: '7d' });

      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return {
        message: `Plan actualizado con éxito a ${getPlanConfig(targetPlan).displayName}`,
        user: updatedSession,
      };
    });
  });
};
