import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Feedback Module...');

  // Cek apakah modul Evaluasi AI sudah ada
  let evaluasiModule = await prisma.module.findFirst({
    where: { name: 'Evaluasi AI' }
  });

  if (!evaluasiModule) {
    evaluasiModule = await prisma.module.create({
      data: {
        name: 'Evaluasi AI',
        routePath: '/admin/feedbacks',
        icon: 'Shield',
      }
    });
    console.log('Created Evaluasi AI module:', evaluasiModule);
  } else {
    console.log('Evaluasi AI module already exists.');
  }

  // Tambahkan permission untuk grup Admin (id 1)
  const adminGroup = await prisma.group.findFirst({
    where: { name: 'Administrator' }
  });

  if (adminGroup) {
    const existingPerm = await prisma.groupPermission.findFirst({
      where: {
        groupId: adminGroup.id,
        moduleId: evaluasiModule.id
      }
    });

    if (!existingPerm) {
      await prisma.groupPermission.create({
        data: {
          groupId: adminGroup.id,
          moduleId: evaluasiModule.id,
          canRead: true,
          canWrite: true
        }
      });
      console.log('Added permission for Admin group to Evaluasi AI module.');
    } else {
      console.log('Admin already has permission for Evaluasi AI module.');
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
