import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.webAuthnCredential.deleteMany();
  await prisma.client.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.professional.deleteMany();

  // Create Demo Professional
  const passwordHash = await argon2.hash('Password123!');

  const demoProf = await prisma.professional.create({
    data: {
      slug: 'demo',
      email: 'demo@espejos.cl',
      passwordHash,
      businessName: 'Estudio Demo Palumbo',
      phone: '+56912345678',
      whatsapp: '+56912345678',
      address: 'Av. Andrés Bello 2425, Providencia, Santiago',
      plan: 'pro',
      googleCalendarConnected: false,
    },
  });

  console.log(`✅ Demo Professional created: ${demoProf.businessName} (slug: ${demoProf.slug})`);

  // Create Services
  const servicesData = [
    {
      name: 'Corte de Cabello Signature',
      description: 'Corte personalizado con lavado, asesoría de imagen y peinado con producto premium.',
      durationMinutes: 35,
      price: 15000,
      order: 1,
    },
    {
      name: 'Arreglo & Ritual de Barba',
      description: 'Diseño de barba con toalla caliente, perfilado a navaja y aceites hidratantes.',
      durationMinutes: 25,
      price: 10000,
      order: 2,
    },
    {
      name: 'Servicio Completo (Corte + Barba)',
      description: 'La experiencia completa: corte signature + ritual de barba + bebida de cortesía.',
      durationMinutes: 60,
      price: 22000,
      order: 3,
    },
  ];

  for (const s of servicesData) {
    await prisma.service.create({
      data: {
        ...s,
        professionalId: demoProf.id,
      },
    });
  }

  console.log(`✅ Created ${servicesData.length} initial services.`);

  // Create Fictitious Clients with Profiles
  const clientsData = [
    {
      firstName: 'Matías',
      lastName: 'González',
      phone: '+56987654321',
      authMethod: 'passkey',
      profile: {
        notes: 'Prefiere degradado bajo (fade). Sensible al alcohol post-afeitado.',
        preferences: { aroma: 'Eucalipto', corte: 'Fade bajo #1', refresco: 'Espresso' },
        tags: ['VIP', 'Recurrente'],
        visitCount: 6,
        totalSpent: 90000,
      },
    },
    {
      firstName: 'Camila',
      lastName: 'Rojas',
      phone: '+56976543210',
      authMethod: 'otp',
      profile: {
        notes: 'Corte de puntas y perfilado ligero de cejas.',
        preferences: { aroma: 'Menta', peinado: 'Ondas suaves' },
        tags: ['Nuevo'],
        visitCount: 1,
        totalSpent: 15000,
      },
    },
    {
      firstName: 'Ignacio',
      lastName: 'Silva',
      phone: '+56965432109',
      authMethod: 'passkey',
      profile: {
        notes: 'Barba larga. Usa bálsamo de cedro.',
        preferences: { barba: 'Larga cuadrada', aceite: 'Cedro y Naranja' },
        tags: ['VIP', 'Fidelizado'],
        visitCount: 10,
        totalSpent: 180000,
      },
    },
    {
      firstName: 'Felipe',
      lastName: 'Morales',
      phone: '+56954321098',
      authMethod: 'otp',
      profile: {
        notes: 'Suele pedir cita los sábados por la mañana.',
        preferences: { horario: 'Sábados AM' },
        tags: ['Fin de semana'],
        visitCount: 3,
        totalSpent: 45000,
      },
    },
    {
      firstName: 'Valentina',
      lastName: 'Castro',
      phone: '+56943210987',
      authMethod: 'otp',
      profile: {
        notes: 'Alergia leve a la fijación con aroma intenso.',
        preferences: { producto: 'Sin fragancia' },
        tags: ['Atención especial'],
        visitCount: 2,
        totalSpent: 30000,
      },
    },
  ];

  for (const c of clientsData) {
    const { profile, ...clientInfo } = c;
    const createdClient = await prisma.client.create({
      data: {
        ...clientInfo,
        professionalId: demoProf.id,
      },
    });

    await prisma.clientProfile.create({
      data: {
        clientId: createdClient.id,
        professionalId: demoProf.id,
        notes: profile.notes,
        preferences: JSON.stringify(profile.preferences),
        tags: JSON.stringify(profile.tags),
        visitCount: profile.visitCount,
        totalSpent: profile.totalSpent,
        lastVisitAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    });
  }

  console.log(`✅ Created ${clientsData.length} demo clients with detailed profiles.`);
  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
