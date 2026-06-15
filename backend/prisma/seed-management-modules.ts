import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Re-seeding database to move User, Group, and Permission management to parent module "Manajemen"...');

  const adminGroupId = 1; // Administrator group ID is 1

  // 1. Clean up old modules (if any) from previous '/admin/...' routes
  await prisma.module.deleteMany({
    where: {
      routePath: { in: ['/admin/users', '/admin/groups', '/admin/permissions'] }
    }
  });
  console.log('Cleaned up old administrative modules.');

  // 2. Find or create the parent "Manajemen" module (parentId: null)
  let manajemenParent = await prisma.module.findFirst({
    where: { name: 'Manajemen', parentId: null }
  });

  if (!manajemenParent) {
    manajemenParent = await prisma.module.create({
      data: {
        name: 'Manajemen',
        routePath: null,
        icon: 'Settings',
        parentId: null
      }
    });
    console.log(`Created parent "Manajemen" module with ID: ${manajemenParent.id}`);
  } else {
    console.log(`Parent "Manajemen" module already exists with ID: ${manajemenParent.id}`);
  }

  // Grant read & write permission for parent "Manajemen" module to Administrator group (required for menu tree fetch)
  const parentPerm = await prisma.groupPermission.findUnique({
    where: {
      groupId_moduleId: {
        groupId: adminGroupId,
        moduleId: manajemenParent.id
      }
    }
  });

  if (!parentPerm) {
    await prisma.groupPermission.create({
      data: {
        groupId: adminGroupId,
        moduleId: manajemenParent.id,
        canRead: true,
        canWrite: true
      }
    });
    console.log('Granted Administrator permissions to parent "Manajemen" module.');
  }

  // 3. Define the submodules to create under "Manajemen"
  const submodules = [
    { name: 'Manajemen User', routePath: '/management/users', icon: 'Users' },
    { name: 'Manajemen Group', routePath: '/management/groups', icon: 'UserCheck' },
    { name: 'Manajemen Akses', routePath: '/management/permissions', icon: 'Key' }
  ];

  for (const sub of submodules) {
    let module = await prisma.module.findFirst({
      where: { routePath: sub.routePath }
    });

    if (!module) {
      module = await prisma.module.create({
        data: {
          name: sub.name,
          routePath: sub.routePath,
          icon: sub.icon,
          parentId: manajemenParent.id
        }
      });
      console.log(`Created "${sub.name}" module with ID: ${module.id}`);
    } else {
      console.log(`Module "${sub.name}" already exists with ID: ${module.id}`);
    }

    // Grant full permissions for Administrator group
    const permission = await prisma.groupPermission.findUnique({
      where: {
        groupId_moduleId: {
          groupId: adminGroupId,
          moduleId: module.id
        }
      }
    });

    if (!permission) {
      await prisma.groupPermission.create({
        data: {
          groupId: adminGroupId,
          moduleId: module.id,
          canRead: true,
          canWrite: true
        }
      });
      console.log(`Granted full permissions (read & write) to Administrator on "${sub.name}"`);
    } else {
      await prisma.groupPermission.update({
        where: {
          groupId_moduleId: {
            groupId: adminGroupId,
            moduleId: module.id
          }
        },
        data: {
          canRead: true,
          canWrite: true
        }
      });
      console.log(`Updated permissions to full (read & write) to Administrator on "${sub.name}"`);
    }
  }

  console.log('Re-seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
