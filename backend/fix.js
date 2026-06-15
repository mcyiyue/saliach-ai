const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({ data: { groupId: 1 } });
  console.log("Updated users to groupId 1");
}
main().catch(console.error).finally(() => prisma.$disconnect());
