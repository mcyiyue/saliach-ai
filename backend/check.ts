import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.chatFeedback.findMany().then(console.log).finally(() => p.$disconnect());
