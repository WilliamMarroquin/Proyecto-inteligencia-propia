
import { ImapFlow } from 'imapflow';
import { PrismaClient } from '@prisma/client';
import { simpleParser } from 'mailparser';
import * as xlsx from 'xlsx';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

export async function runSync() {
  const config = await prisma.configuracion.findFirst();
  if (!config) {
    throw new Error("No hay configuracion.");
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
                            
                            // RESPALDO EN LA NUBE (Cloudinary)
                            try {
                                const now = new Date();
                                const year = now.getFullYear().toString();
                                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                                const day = now.getDate().toString().padStart(2, '0');
                                const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
                                
                                const safeName = `Reporte_${year}${month}${day}_${time}`;
                                
                                console.log(`Subiendo Excel a Cloudinary: ${safeName}...`);
                                
                                const uploadResult = await new Promise((resolve, reject) => {
                                    const uploadStream = cloudinary.uploader.upload_stream(
                                        {
                                            resource_type: 'raw',
                                            folder: 'orbita-respaldos',
                                            public_id: safeName + '.xlsx'
                                        },
                                        (error, result) => {
                                            if (error) reject(error);
                                            else resolve(result);
                                        }
                                    );
                                    uploadStream.end(att.content);
                                });

                                console.log(`Excel subido exitosamente: ${uploadResult.secure_url}`);
                                
                                await prisma.respaldoExcel.create({
                                    data: {
                                        nombre: safeName + '.xlsx',
                                        url: uploadResult.secure_url
                                    }
                                });
                            } catch (backupErr) {
                                console.error(`Error al subir el Excel a Cloudinary:`, backupErr.message);
                            }

                            const pagosData = parseExcelBuffer(att.content);
                            console.log(`Se extrajeron ${pagosData.length} registros del Excel.`);
                            
                            for (const pago of pagosData) {
                                // PROTOTIPO: Buscar cliente o crearlo automáticamente
                                let cliente = await prisma.cliente.findFirst({
                                    where: { nombre: pago.nombreCliente }
                                });
                                
                                let convenioId = null;
                                
                                if (!cliente) {
                                    cliente = await prisma.cliente.create({
                                        data: {
                                            nombre: pago.nombreCliente,
                                            email: 'mock@example.com',
                                            telefono: '5555-5555'
                                        }
                                    });
                                    
                                    // Crear convenio mock
                                    const convenio = await prisma.convenio.create({
                                        data: {
                                            clienteId: cliente.id,
                                            montoCuota: pago.monto > 0 ? pago.monto : 1000.00, // asume cuota = pago
                                            diaCorte: 15
                                        }
                                    });
                                    convenioId = convenio.id;
                                } else {
                                    const convenios = await prisma.convenio.findMany({ where: { clienteId: cliente.id }});
                                    if (convenios.length > 0) convenioId = convenios[0].id;
                                }

                                await prisma.pago.create({
                                    data: {
                                        nombreCliente: pago.nombreCliente,
                                        monto: pago.monto,
                                        fecha: pago.fecha,
                                        referencia: pago.referencia,
                                        estado: 'completado',
                                        clienteId: cliente.id,
                                        convenioId: convenioId
                                    }
                                });
                                pagosInsertados++;
                            }
                            console.log(`Se insertaron ${pagosInsertados} registros enlazados a Clientes en la BD.`);
                        }
                    }
                } else {
                    console.log(`No se encontraron adjuntos en UID: ${uid}`);
                }
            }
        }
        
        return { success: true, message: `Sincronización completada. Se insertaron ${pagosInsertados} pagos.` };
    } finally {
        lock.release();
    }
  } catch (err) {
    console.error("IMAP Error:", err.message);
    throw err;
  } finally {
    if (client && client.usable) await client.logout();
    await prisma.$disconnect();
  }
}

// Para ejecución local por child_process
if (process.argv[1] && process.argv[1].includes('sync.mjs')) {
    runSync().then(res => console.log(JSON.stringify(res))).catch(err => {
        console.error(err);
        process.exit(1);
    });
}
