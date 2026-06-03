import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const config = await prisma.configuracion.findFirst();
  console.log("DB Config:", config);
}
run().catch(console.error).finally(() => prisma.$disconnect());
