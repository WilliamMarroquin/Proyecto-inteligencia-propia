import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando base de datos...");
  
  // El orden es importante por las relaciones de llaves foráneas
  await prisma.pago.deleteMany({});
  console.log("Pagos eliminados.");
  
  await prisma.convenio.deleteMany({});
  console.log("Convenios eliminados.");
  
  await prisma.cliente.deleteMany({});
  console.log("Clientes eliminados.");

  // Opcional: limpiar chats para que la IA inicie en blanco también
  await prisma.chatMessage.deleteMany({});
  await prisma.chatSession.deleteMany({});
  console.log("Historial de IA eliminado.");
  
  console.log("¡Base de datos completamente limpia y lista para la presentación!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
