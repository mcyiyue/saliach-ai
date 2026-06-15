const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const docs = await prisma.document.findMany({ where: { content: { contains: 'saliach' } } });
  console.log(docs.length, 'docs found with saliach');
  if(docs.length > 0) console.log(docs[0].content.substring(0, 200));

  const docs2 = await prisma.document.findMany({ where: { content: { contains: 'shaliach' } } });
  console.log(docs2.length, 'docs found with shaliach');
  if(docs2.length > 0) console.log(docs2[0].content.substring(0, 200));
}
main().catch(console.error).finally(() => prisma.$disconnect());
