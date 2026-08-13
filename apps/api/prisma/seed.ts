import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with default professionals and super admin...');

  // Clean existing data
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.webAuthnCredential.deleteMany();
  await prisma.client.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.professional.deleteMany();

  const defaultPasswordHash = await argon2.hash('Password123!');
  const adminPasswordHash = await argon2.hash('Admin123!');

  // 1. Create Super Admin Professional
  const adminProf = await prisma.professional.create({
    data: {
      slug: 'admin',
      email: 'admin@espejos.cl',
      passwordHash: adminPasswordHash,
      businessName: 'Administración Espejos Studio',
      phone: '+56900000000',
      whatsapp: '+56900000000',
      address: 'Casa Matriz Espejos Studio Pro',
      plan: 'pro',
    },
  });

  // 2. Create User's Account (2jota27@gmail.com / john)
  const johnProf = await prisma.professional.create({
    data: {
      slug: 'john',
      email: '2jota27@gmail.com',
      passwordHash: defaultPasswordHash,
      businessName: 'Espejos Studio - John',
      phone: '+56912345678',
      whatsapp: '+56912345678',
      address: 'Estudio Central, Santiago',
      plan: 'pro',
    },
  });

  // 3. Create Demo Professional
  const demoProf = await prisma.professional.create({
    data: {
      slug: 'demo',
      email: 'demo@espejos.cl',
      passwordHash: defaultPasswordHash,
      businessName: 'Estudio Demo Palumbo',
      phone: '+56987654321',
      whatsapp: '+56987654321',
      address: 'Av. Andrés Bello 2425, Providencia, Santiago',
      plan: 'pro',
    },
  });

  console.log(`✅ Default Professionals created:
    - Admin: admin@espejos.cl (Password: Admin123!)
    - John: 2jota27@gmail.com (Password: Password123!)
    - Demo: demo@espejos.cl (Password: Password123!)
  `);

  // Create Services for John
  const servicesJohn = [
    {
      name: 'Corte clásico / Fade',
      description: 'Corte de precisión con degradado impecable, lavado y peinado.',
      durationMinutes: 30,
      price: 15000,
      order: 1,
      professionalId: johnProf.id,
    },
    {
      name: 'Perfilado de Barba & Ritual',
      description: 'Diseño de barba con toalla caliente y aceites naturales.',
      durationMinutes: 30,
      price: 10000,
      order: 2,
      professionalId: johnProf.id,
    },
  ];

  for (const s of servicesJohn) {
    await prisma.service.create({ data: s });
  }

  // Create Services for Demo
  const servicesDemo = [
    {
      name: 'Corte Signature & Peinado',
      description: 'Asesoría de visagismo y corte personalizado.',
      durationMinutes: 40,
      price: 18000,
      order: 1,
      professionalId: demoProf.id,
    },
  ];

  for (const s of servicesDemo) {
    await prisma.service.create({ data: s });
  }

  // Create Sample Clients for John
  const client1 = await prisma.client.create({
    data: {
      firstName: 'Francisco',
      lastName: 'Pérez',
      phone: '+56911223344',
      professionalId: johnProf.id,
    },
  });

  await prisma.clientProfile.create({
    data: {
      clientId: client1.id,
      professionalId: johnProf.id,
      notes: 'Visagismo ovalado. Degradado medio máquina 1.5. Prefiere corte clásico arriba.',
      tags: JSON.stringify(['Google Assistant', 'Fidelizado']),
      visitCount: 4,
      totalSpent: 60000,
    },
  });

  // Create Sample Tomorrow Appointment for John
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 30, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 30, 0, 0);

  await prisma.appointment.create({
    data: {
      professionalId: johnProf.id,
      clientId: client1.id,
      serviceId: (await prisma.service.findFirst({ where: { professionalId: johnProf.id } }))!.id,
      startsAt: tomorrow,
      endsAt: tomorrowEnd,
      status: 'confirmed',
      clientNote: 'Cita reservada automáticamente desde Google Assistant',
    },
  });

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
