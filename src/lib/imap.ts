import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export async function fetchEmailsAndExtractExcel(config: any) {
  if (!config.emailHost || !config.emailUser || !config.emailPassword) {
    throw new Error('Credenciales de correo incompletas en la configuración.');
  }

  const client = new ImapFlow({
    host: config.emailHost,
    port: config.emailPort || 993,
    secure: true, // Forzar a true para puerto 993 de Gmail
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      user: config.emailUser,
      pass: config.emailPassword
    },
    logger: false
  });

  const attachments: { filename: string; content: Buffer }[] = [];

  try {
    await client.connect();
    
    // Seleccionamos la bandeja de entrada
    let lock = await client.getMailboxLock('INBOX');
    try {
      // Buscamos correos no leídos.
      const searchCriteria: any = { seen: false };
      
      if (config.bankSender) {
        searchCriteria.from = config.bankSender;
      }
      if (config.emailKeyword) {
        // Buscar la palabra clave en el Asunto del correo
        searchCriteria.header = { subject: config.emailKeyword };
      }

      const messages = client.fetch(searchCriteria, { source: true, uid: true });

      for await (let message of messages) {
        // Parseamos el correo con mailparser
        if (message.source) {
          const parsed = await simpleParser(message.source);
          
          if (parsed.attachments && parsed.attachments.length > 0) {
            for (const att of parsed.attachments) {
              // Verificamos el formato configurado (por defecto .xlsx)
              const ext = config.bankFileExtension ? `.${config.bankFileExtension.replace(/^\./, '')}` : '.xlsx';
              if (att.filename && att.filename.toLowerCase().endsWith(ext.toLowerCase())) {
                attachments.push({
                  filename: att.filename,
                  content: att.content as Buffer
                });
              }
            }
          }
          
          // Marcamos el correo como leído (opcional, recomendado para no procesarlo dos veces)
          await client.messageFlagsAdd({ uid: message.uid }, ['\\Seen']);
        }
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("Error crítico durante la conexión IMAP:", err);
    throw err;
  } finally {
    if (client && client.usable) {
      try {
        await client.logout();
      } catch (e) {
        console.error("Error cerrando sesión IMAP:", e);
      }
    }
  }

  return attachments;
}
