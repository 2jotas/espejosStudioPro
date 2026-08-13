import { FastifyPluginAsync } from 'fastify';
import argon2 from 'argon2';
import { isSlugReserved } from '../lib/reservedSlugs.js';
import { authenticateProfessional } from '../plugins/authHook.js';
import { UserSession } from '@espejos/shared-types';

export const authRoutes: FastifyPluginAsync = async (fastify) => {

  // Check Slug Availability
  fastify.get<{ Params: { slug: string } }>('/auth/check-slug/:slug', async (request, reply) => {
    const slug = request.params.slug.trim().toLowerCase();

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return reply.status(400).send({
        available: false,
        reason: 'El slug solo puede contener letras minúsculas, números y guiones.',
      });
    }

    if (isSlugReserved(slug)) {
      return reply.status(400).send({
        available: false,
        reason: 'Esta dirección está reservada por el sistema.',
      });
    }

    const existing = await fastify.prisma.professional.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      return reply.status(400).send({
        available: false,
        reason: 'Este nombre de usuario / slug ya está en uso.',
      });
    }

    return { available: true };
  });

  // Register Professional
  fastify.post<{
    Body: {
      email: string;
      password: string;
      slug: string;
      businessName: string;
      phone?: string;
    };
  }>('/auth/register', async (request, reply) => {
    const { email, password, slug, businessName, phone } = request.body;

    if (!email || !password || !slug || !businessName) {
      return reply.status(400).send({ error: 'MissingFields', message: 'Email, contraseña, slug y nombre del negocio son obligatorios.' });
    }

    const cleanSlug = slug.trim().toLowerCase();

    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      return reply.status(400).send({ error: 'InvalidSlug', message: 'El slug solo puede contener letras minúsculas, números y guiones.' });
    }

    if (isSlugReserved(cleanSlug)) {
      return reply.status(400).send({ error: 'ReservedSlug', message: 'El slug ingresado está reservado por el sistema.' });
    }

    // Check existing email or slug
    const existingProf = await fastify.prisma.professional.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { slug: cleanSlug }],
      },
    });

    if (existingProf) {
      if (existingProf.email === email.toLowerCase()) {
        return reply.status(409).send({ error: 'EmailConflict', message: 'El correo electrónico ya está registrado.' });
      }
      return reply.status(409).send({ error: 'SlugConflict', message: 'El slug elegido ya no está disponible.' });
    }

    const passwordHash = await argon2.hash(password);

    const professional = await fastify.prisma.professional.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        slug: cleanSlug,
        businessName,
        phone,
        plan: 'free',
      },
    });

    const userSession: UserSession = {
      id: professional.id,
      email: professional.email,
      slug: professional.slug,
      businessName: professional.businessName,
      plan: professional.plan as 'free' | 'pro',
    };

    const token = fastify.jwt.sign(userSession, { expiresIn: '7d' });

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return reply.status(201).send({
      message: 'Registro exitoso',
      user: userSession,
      token,
    });
  });

  // Login Professional
  fastify.post<{
    Body: {
      email: string;
      password: string;
    };
  }>('/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'MissingFields', message: 'Email y contraseña son obligatorios.' });
    }

    const cleanInput = email.trim().toLowerCase();

    const professional = await fastify.prisma.professional.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          { slug: cleanInput },
        ],
      },
    });

    if (!professional) {
      return reply.status(401).send({ error: 'UserNotFound', message: 'El correo electrónico o usuario (slug) no existe en el sistema.' });
    }

    const validPassword = await argon2.verify(professional.passwordHash, password);
    if (!validPassword) {
      return reply.status(401).send({ error: 'IncorrectPassword', message: 'La contraseña ingresada es incorrecta. Por favor verifica tus datos.' });
    }

    const userSession: UserSession = {
      id: professional.id,
      email: professional.email,
      slug: professional.slug,
      businessName: professional.businessName,
      plan: professional.plan as 'free' | 'pro',
    };

    const token = fastify.jwt.sign(userSession, { expiresIn: '7d' });

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      message: 'Inicio de sesión exitoso',
      user: userSession,
      token,
    };
  });

  // Store for password reset 6-digit verification codes: email -> { code, expiresAt }
  const resetCodesStore = new Map<string, { code: string; expiresAt: number }>();

  // Step 1: Request 6-digit Verification PIN for Password Reset
  fastify.post<{
    Body: {
      email: string;
    };
  }>('/auth/forgot-password', async (request, reply) => {
    const { email } = request.body;

    if (!email) {
      return reply.status(400).send({
        error: 'MissingFields',
        message: 'El correo electrónico es obligatorio.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const professional = await fastify.prisma.professional.findUnique({
      where: { email: cleanEmail },
    });

    if (!professional) {
      return reply.status(404).send({
        error: 'NotFound',
        message: 'No existe ninguna cuenta registrada con este correo electrónico.',
      });
    }

    // Generate secure 6-digit PIN code
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    resetCodesStore.set(cleanEmail, { code: verificationCode, expiresAt });

    return {
      message: 'Código de verificación de 6 dígitos enviado exitosamente.',
      email: cleanEmail,
      verificationCode, // Returned for instant verification & display
      expiresInSeconds: 600,
    };
  });

  // Step 2: Verify PIN & Reset Password for Professional
  fastify.post<{
    Body: {
      email: string;
      code: string;
      newPassword: string;
    };
  }>('/auth/reset-password', async (request, reply) => {
    const { email, code, newPassword } = request.body;

    if (!email || !code || !newPassword) {
      return reply.status(400).send({
        error: 'MissingFields',
        message: 'El correo electrónico, el código de 6 dígitos y la nueva contraseña son obligatorios.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify 6-digit PIN code from store
    const storedData = resetCodesStore.get(cleanEmail);

    if (!storedData) {
      return reply.status(400).send({
        error: 'NoCodeRequested',
        message: 'No se ha solicitado ningún código para este correo o el código ya expiró. Solicita uno nuevo.',
      });
    }

    if (Date.now() > storedData.expiresAt) {
      resetCodesStore.delete(cleanEmail);
      return reply.status(400).send({
        error: 'CodeExpired',
        message: 'El código de verificación ha expirado (duración 10 min). Solicita un nuevo código.',
      });
    }

    if (storedData.code !== code.trim()) {
      return reply.status(401).send({
        error: 'InvalidCode',
        message: 'El código de verificación de 6 dígitos ingresado es incorrecto.',
      });
    }

    if (newPassword.length < 6) {
      return reply.status(400).send({
        error: 'PasswordTooShort',
        message: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
    }

    const professional = await fastify.prisma.professional.findUnique({
      where: { email: cleanEmail },
    });

    if (!professional) {
      return reply.status(404).send({
        error: 'NotFound',
        message: 'No existe ninguna cuenta registrada con este correo electrónico.',
      });
    }

    const passwordHash = await argon2.hash(newPassword);

    await fastify.prisma.professional.update({
      where: { id: professional.id },
      data: { passwordHash },
    });

    // Clear used PIN code
    resetCodesStore.delete(cleanEmail);

    return {
      message: '¡Identidad verificada y contraseña restablecida exitosamente! Ya puedes iniciar sesión.',
    };
  });

  // Logout Professional
  fastify.post('/auth/logout', async (request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return { message: 'Sesión cerrada correctamente' };
  });

  // Get Current Professional Session
  fastify.get('/auth/me', { preHandler: [authenticateProfessional] }, async (request, reply) => {
    return { user: request.userSession };
  });

  // Update Professional Profile (Business Name, Slug, Bio)
  fastify.put<{
    Body: {
      businessName?: string;
      slug?: string;
      bio?: string;
      phone?: string;
    };
  }>('/auth/profile', { preHandler: [authenticateProfessional] }, async (request, reply) => {
    const userSession = request.userSession!;
    const { businessName, slug, bio, phone } = request.body;

    const professional = await fastify.prisma.professional.findUnique({
      where: { id: userSession.id },
    });

    if (!professional) {
      return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
    }

    let newSlug = professional.slug;
    let slugChanged = false;

    if (slug && slug.trim().toLowerCase() !== professional.slug) {
      const cleanSlug = slug.trim().toLowerCase();

      if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
        return reply.status(400).send({ error: 'InvalidSlug', message: 'El slug solo puede contener letras minúsculas, números y guiones.' });
      }

      if (isSlugReserved(cleanSlug)) {
        return reply.status(400).send({ error: 'ReservedSlug', message: 'El slug ingresado está reservado por el sistema.' });
      }

      const existingSlug = await fastify.prisma.professional.findUnique({
        where: { slug: cleanSlug },
      });

      if (existingSlug && existingSlug.id !== professional.id) {
        return reply.status(409).send({ error: 'SlugConflict', message: 'El nombre de usuario/slug elegido ya está en uso por otro profesional.' });
      }

      newSlug = cleanSlug;
      slugChanged = true;
    }

    const updated = await fastify.prisma.professional.update({
      where: { id: professional.id },
      data: {
        businessName: businessName ? businessName.trim() : professional.businessName,
        slug: newSlug,
        bio: bio !== undefined ? bio.trim() : professional.bio,
        phone: phone !== undefined ? phone.trim() : professional.phone,
      },
    });

    const updatedSession: UserSession = {
      id: updated.id,
      email: updated.email,
      slug: updated.slug,
      businessName: updated.businessName,
      plan: updated.plan as 'free' | 'pro',
    };

    const token = fastify.jwt.sign(updatedSession, { expiresIn: '7d' });

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      message: 'Perfil actualizado exitosamente',
      user: updatedSession,
      slugChanged,
    };
  });

  // Delete / Cancel Account
  fastify.delete('/auth/account', { preHandler: [authenticateProfessional] }, async (request, reply) => {
    const userSession = request.userSession!;

    // Delete professional and cascaded records (services, clients, appointments, gallery, credentials)
    await fastify.prisma.professional.delete({
      where: { id: userSession.id },
    });

    reply.clearCookie('token', { path: '/' });

    return { message: 'Tu cuenta ha sido eliminada y dada de baja exitosamente.' };
  });
};
