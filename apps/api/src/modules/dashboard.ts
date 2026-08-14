import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/dashboard/stats - Real-time Commercial & Data Science Analytics
  fastify.get<{
    Querystring: {
      timeframe?: 'today' | 'week' | 'month' | 'all';
      slug?: string;
    };
  }>('/dashboard/stats', { preHandler: authenticateProfessional }, async (request, reply) => {
    try {
      const userSession = request.userSession;
      if (!userSession) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'No autenticado.' });
      }

      // Find professional by ID or slug
      let professionalId = userSession.id;
      if (userSession.slug === 'admin' && request.query.slug) {
        const target = await fastify.prisma.professional.findUnique({ where: { slug: request.query.slug } });
        if (target) professionalId = target.id;
      }

      const timeframe = request.query.timeframe || 'month';

      // Define date boundaries
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      let timeframeStart = new Date(0); // 'all' default
      if (timeframe === 'today') {
        timeframeStart = startOfToday;
      } else if (timeframe === 'week') {
        const dayOfWeek = now.getDay() || 7; // Monday start
        timeframeStart = new Date(now);
        timeframeStart.setDate(now.getDate() - (dayOfWeek - 1));
        timeframeStart.setHours(0, 0, 0, 0);
      } else if (timeframe === 'month') {
        timeframeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      }

      // 1. Fetch appointments in timeframe
      const appointments = await fastify.prisma.appointment.findMany({
        where: {
          professionalId,
          startsAt: { gte: timeframeStart },
        },
        include: {
          service: true,
          client: {
            include: { profile: true },
          },
        },
        orderBy: { startsAt: 'asc' },
      });

      const formatChileDate = (d: Date) => {
        return new Intl.DateTimeFormat('es-CL', {
          timeZone: 'America/Santiago',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(d);
      };

      const todayChileStr = formatChileDate(now);

      // 2. Fetch today's appointments matching Chilean local date
      const allAppointmentsForProf = await fastify.prisma.appointment.findMany({
        where: { professionalId },
        include: { service: true, client: true },
        orderBy: { startsAt: 'asc' },
      });

      const todayAppointments = allAppointmentsForProf.filter((a) => {
        return formatChileDate(new Date(a.startsAt)) === todayChileStr;
      });

      // 3. Compute Financial Metrics
      const validApps = appointments.filter((a) => a.status === 'confirmed' || a.status === 'completed');
      const timeframeRevenue = validApps.reduce((sum, a) => sum + (a.service?.price || 0), 0);

      const todayValidApps = todayAppointments.filter((a) => a.status === 'confirmed' || a.status === 'completed');
      const todayRevenue = todayValidApps.reduce((sum, a) => sum + (a.service?.price || 0), 0);

      const completedCount = appointments.filter((a) => a.status === 'completed').length;
      const averageTicket = validApps.length > 0 ? Math.round(timeframeRevenue / validApps.length) : 0;

      const totalWorkedMinutes = validApps.reduce((sum, a) => sum + (a.service?.durationMinutes || 30), 0);
      const profitabilityPerMinute = totalWorkedMinutes > 0 ? Math.round(timeframeRevenue / totalWorkedMinutes) : 0;

      // 4. Capacity Utilization (Schedule occupancy for 8-hour workday = 480 mins)
      const businessDaysInRange = timeframe === 'today' ? 1 : timeframe === 'week' ? 6 : 24;
      const availableCapacityMinutes = businessDaysInRange * 480;
      const capacityUtilizationRate = Math.min(100, Math.round((totalWorkedMinutes / availableCapacityMinutes) * 100));

      // 5. Client Cohort & Retention Metrics
      const totalClients = await fastify.prisma.client.count({ where: { professionalId } });
      const clientProfiles = await fastify.prisma.clientProfile.findMany({ where: { professionalId } });
      const recurringClients = clientProfiles.filter((cp) => cp.visitCount > 1).length;
      const retentionRate = totalClients > 0 ? Math.round((recurringClients / totalClients) * 100) : 0;

      // 6. Service Breakdown Ranking (Pareto)
      const serviceStatsMap = new Map<string, { name: string; price: number; count: number; totalRevenue: number }>();

      validApps.forEach((app) => {
        if (!app.service) return;
        const existing = serviceStatsMap.get(app.service.id) || {
          name: app.service.name,
          price: app.service.price,
          count: 0,
          totalRevenue: 0,
        };
        existing.count += 1;
        existing.totalRevenue += app.service.price;
        serviceStatsMap.set(app.service.id, existing);
      });

      const topServices = Array.from(serviceStatsMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

      return {
        timeframe,
        metrics: {
          timeframeRevenue,
          todayRevenue,
          totalAppointments: appointments.length,
          confirmedAppointments: validApps.length,
          completedAppointments: completedCount,
          averageTicket,
          profitabilityPerMinute,
          capacityUtilizationRate,
          totalClients,
          recurringClients,
          retentionRate,
        },
        topServices,
        todayUpcoming: todayAppointments.map((a) => ({
          id: a.id,
          startsAt: a.startsAt,
          endsAt: a.endsAt,
          status: a.status,
          serviceName: a.service?.name || 'Servicio',
          servicePrice: a.service?.price || 0,
          clientName: `${a.client.firstName} ${a.client.lastName}`,
          clientPhone: a.client.phone,
          clientNote: a.clientNote,
        })),
      };
    } catch (e: any) {
      return reply.status(500).send({ error: 'ServerError', message: e.message });
    }
  });
};
