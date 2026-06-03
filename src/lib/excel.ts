import * as xlsx from 'xlsx';

export interface PagoData {
  nombreCliente: string;
  monto: number;
  fecha: Date;
  referencia?: string;
}

export function parseExcelBuffer(buffer: Buffer): PagoData[] {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convertimos a JSON asumiendo que la primera fila tiene los encabezados: Nombre, Monto, Fecha, Referencia
  const data = xlsx.utils.sheet_to_json<any>(sheet);
  
  const pagos: PagoData[] = [];
  
  for (const row of data) {
    // Extraer datos usando los nombres de columnas reales del Excel del banco
    const nombre = row['DESCRIPCION_DETALLE'] || row['Nombre'] || row['Cliente'] || 'Desconocido';
    
    // El monto del pago es el "ABONO" (dinero que entra)
    const monto = parseFloat(row['ABONO'] || row['Monto'] || row['Total'] || '0');
    
    // Parseo de fecha
    let fecha = new Date();
    const rawDate = row['FECHA_OPERACION'] || row['Fecha'] || row['fecha'];
    if (rawDate) {
      if (typeof rawDate === 'number') {
        // Excel serial date
        fecha = new Date((rawDate - (25567 + 2)) * 86400 * 1000);
      } else {
        fecha = new Date(rawDate);
      }
      // Ajuste de zona horaria: fijar al mediodía UTC para evitar que baje al día anterior
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
