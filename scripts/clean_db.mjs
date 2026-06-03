import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  console.log("Limpiando la base de datos...");
  const count = await prisma.pago.deleteMany({});
  console.log(`¡Listo! Se eliminaron ${count.count} registros de pagos.`);
}

clean().catch(console.error).finally(() => prisma.$disconnect());
