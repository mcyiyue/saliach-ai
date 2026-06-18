import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.module.update({
  where: { id: 12 },
  data: { parentId: 3 }
}).then(console.log).finally(() => p.$disconnect());
