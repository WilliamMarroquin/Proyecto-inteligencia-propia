import { ImapFlow } from 'imapflow';
import { PrismaClient } from '@prisma/client';
import { simpleParser } from 'mailparser';

const prisma = new PrismaClient();

async function run() {
  const config = await prisma.configuracion.findFirst();
  console.log("Intentando conectar a IMAP...");
  const client = new ImapFlow({
    host: config.emailHost,
    port: config.emailPort || 993,
    secure: true,
    tls: { rejectUnauthorized: false },
    auth: {
      user: config.emailUser,
      pass: config.emailPassword
    },
    logger: false 
  });

  try {
    await client.connect();
    console.log("Conexión IMAP exitosa. Obteniendo lock de INBOX...");
    
    let lock = await client.getMailboxLock('INBOX');
    try {
        console.log("Buscando correos no leídos...");
        const searchCriteria = { seen: false };
        if (config.bankSender) searchCriteria.from = config.bankSender;
        if (config.emailKeyword) searchCriteria.header = { subject: config.emailKeyword };
        
        console.log("Criterios:", searchCriteria);
        
        const messages = client.fetch(searchCriteria, { source: true, uid: true });
        let found = 0;
        
        for await (let message of messages) {
            found++;
            console.log("Mensaje encontrado! UID:", message.uid);
        }
        console.log(`Se encontraron ${found} mensajes.`);
    } finally {
        lock.release();
    }
    
    await client.logout();
  } catch (err) {
    console.error("Error en IMAP:", err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
