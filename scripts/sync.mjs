import { ImapFlow } from 'imapflow';
import { PrismaClient } from '@prisma/client';
import { simpleParser } from 'mailparser';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseExcelBuffer(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  const pagos = [];
  
  for (const row of data) {
    const nombre = row['DESCRIPCION_DETALLE'] || row['Nombre'] || row['Cliente'] || 'Desconocido';
    const monto = parseFloat(row['ABONO'] || row['Monto'] || row['Total'] || '0');
    
    let fecha = new Date();
    const rawDate = row['FECHA_OPERACION'] || row['Fecha'] || row['fecha'];
    if (rawDate) {
      if (typeof rawDate === 'number') {
        fecha = new Date((rawDate - (25567 + 2)) * 86400 * 1000);
      } else {
        fecha = new Date(rawDate);
      }
      // Ajuste de zona horaria: fijar al mediodía UTC para evitar que baje al día anterior en zonas horarias locales
      fecha.setUTCHours(12, 0, 0, 0);
    }
    
    const referencia = row['NO_REFERENCIA'] || row['Referencia'] || row['Ref'] || null;

    if (!isNaN(monto) && monto > 0) {
      pagos.push({
        nombreCliente: nombre,
        monto,
        fecha,
        referencia: String(referencia)
      });
    }
  }
  return pagos;
}

async function run() {
  const config = await prisma.configuracion.findFirst();
  if (!config) {
    console.error("No hay configuracion.");
    process.exit(1);
  }

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

  client.on('error', err => {
    console.error("IMAP Connection Error Event:", err.message);
  });

  try {
    await client.connect();
    let lock = await client.getMailboxLock('INBOX');
    try {
        const searchCriteria = { seen: false };
        if (config.bankSender) searchCriteria.from = config.bankSender;
        if (config.emailKeyword) searchCriteria.header = { subject: config.emailKeyword };
        
        console.log("Buscando correos con criterios:", searchCriteria);
        // Usar seq en lugar de fetch para obtener UIDs primero
        const uids = [];
        for await (let msg of client.fetch(searchCriteria, { uid: true })) {
            uids.push(msg.uid);
        }
        console.log(`Se encontraron ${uids.length} correos no leídos.`);

        let pagosInsertados = 0;

        for (const uid of uids) {
            console.log(`Descargando correo UID: ${uid}`);
            const message = await client.fetchOne(uid.toString(), { source: true }, { uid: true });
            if (message && message.source) {
                console.log(`Parseando correo UID: ${uid}`);
                const parsed = await simpleParser(message.source);
                
                // 1. Marcar como leído INMEDIATAMENTE
                try {
                    await client.messageFlagsAdd(uid.toString(), ['\\Seen'], { uid: true });
                    console.log(`Correo UID: ${uid} marcado como leído con éxito.`);
                } catch (flagErr) {
                    console.error(`No se pudo marcar como leído el UID: ${uid}`, flagErr.message);
                }

                if (parsed.attachments && parsed.attachments.length > 0) {
                    console.log(`Encontrados ${parsed.attachments.length} adjuntos en UID: ${uid}`);
                    for (const att of parsed.attachments) {
                        if (att.filename && att.filename.endsWith('.xlsx')) {
                            console.log(`Procesando Excel: ${att.filename}`);
                            
                            // RESPALDO AUTOMÁTICO
                            try {
                                const now = new Date();
                                const year = now.getFullYear().toString();
                                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                                const day = now.getDate().toString().padStart(2, '0');
                                const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
                                
                                const backupDir = path.join(process.cwd(), 'respaldos_excel', year, month);
                                fs.mkdirSync(backupDir, { recursive: true });
                                
                                const safeName = `Reporte_${year}${month}${day}_${time}.xlsx`;
                                const backupPath = path.join(backupDir, safeName);
                                
                                fs.writeFileSync(backupPath, att.content);
                                console.log(`Excel respaldado en: ${backupPath}`);
                            } catch (backupErr) {
                                console.error(`Error al respaldar el Excel:`, backupErr.message);
                            }

                            const pagosData = parseExcelBuffer(att.content);
                            console.log(`Se extrajeron ${pagosData.length} registros del Excel.`);
                            
                            const insertData = pagosData.map(pago => ({
                                nombreCliente: pago.nombreCliente,
                                monto: pago.monto,
                                fecha: pago.fecha,
                                referencia: pago.referencia,
                                estado: 'completado'
                            }));

                            if (insertData.length > 0) {
                                await prisma.pago.createMany({
                                    data: insertData
                                });
                                pagosInsertados += insertData.length;
                                console.log(`Se insertaron ${insertData.length} registros en la BD.`);
                            }
                        }
                    }
                } else {
                    console.log(`No se encontraron adjuntos en UID: ${uid}`);
                }
            }
        }
        console.log(JSON.stringify({ success: true, message: `Sincronización completada. Se insertaron ${pagosInsertados} pagos.` }));
    } finally {
        lock.release();
    }
  } catch (err) {
    console.error("IMAP Error:", err.message);
    process.exit(1);
  } finally {
    if (client && client.usable) await client.logout();
    await prisma.$disconnect();
  }
}

run();
