import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clearChats() {
  try {
    await prisma.chatMessage.deleteMany({});
    await prisma.chatSession.deleteMany({});
    console.log("¡Todos los historiales de chat han sido eliminados correctamente!");
  } catch (error) {
    console.error("Error limpiando chats:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearChats();
