import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running seed to register External Sources module and permissions...');

  // 1. Find the "Admin" parent module
  const adminParent = await prisma.module.findFirst({
    where: { name: 'Admin', parentId: null }
  });

  if (!adminParent) {
    console.error('Error: Parent "Admin" module not found in database.');
    return;
  }

  console.log(`Found parent Admin module with ID: ${adminParent.id}`);

  // 2. Check if the "Sumber Eksternal" module already exists
  const existingModule = await prisma.module.findFirst({
    where: { routePath: '/admin/external-links' }
  });

  let moduleId: number;

  if (!existingModule) {
    const newModule = await prisma.module.create({
      data: {
        name: 'Sumber Eksternal',
        routePath: '/admin/external-links',
        icon: 'Link',
        parentId: adminParent.id
      }
    });
    moduleId = newModule.id;
    console.log(`Created "Sumber Eksternal" module with ID: ${moduleId}`);
  } else {
    moduleId = existingModule.id;
    console.log(`Module "Sumber Eksternal" already exists with ID: ${moduleId}`);
  }

  // 3. Grant Administrator group (ID: 1) permissions to this module
  const adminGroup = await prisma.group.findUnique({
    where: { id: 1 } // Administrator group id is 1
  });

  if (!adminGroup) {
    console.error('Error: Administrator group (ID: 1) not found.');
    return;
  }

  const existingPermission = await prisma.groupPermission.findFirst({
    where: { groupId: adminGroup.id, moduleId: moduleId }
  });

  if (!existingPermission) {
    await prisma.groupPermission.create({
      data: {
        groupId: adminGroup.id,
        moduleId: moduleId,
        canRead: true,
        canWrite: true
      }
    });
    console.log(`Granted full permissions (read & write) to Administrator group (ID: ${adminGroup.id}) for module ID: ${moduleId}`);
  } else {
    // Make sure it has canRead and canWrite true
    await prisma.groupPermission.update({
      where: {
        groupId_moduleId: {
          groupId: adminGroup.id,
          moduleId: moduleId
        }
      },
      data: {
        canRead: true,
        canWrite: true
      }
    });
    console.log(`Permissions already exist for Administrator group on module ID: ${moduleId}, updated to read/write true`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
