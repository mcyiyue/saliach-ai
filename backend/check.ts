import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.group.findMany().then(console.log).finally(() => p.$disconnect());
