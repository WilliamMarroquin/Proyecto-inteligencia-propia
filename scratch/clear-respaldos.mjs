import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.respaldoExcel.deleteMany({});
  console.log("Tabla RespaldoExcel limpiada correctamente.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
