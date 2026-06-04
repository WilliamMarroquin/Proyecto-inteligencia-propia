import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@finasist.com' },
    update: { 
      password: hash,
      permisos: ["dashboard", "cartera", "archivos", "datos", "ia", "ajustes", "usuarios", "auditoria"]
    },
    create: {
      nombre: 'Super',
      apellidos: 'Administrador',
      email: 'admin@finasist.com',
      password: hash,
      telefono: '+502 00000000',
      rol: 'SUPER_ADMIN',
      permisos: ["dashboard", "cartera", "archivos", "datos", "ia", "ajustes", "usuarios", "auditoria"],
      estado: 'activo'
    }
  });
  console.log("✅ Super Admin creado exitosamente.");
  console.log("Email: admin@finasist.com");
  console.log("Password: admin123");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
