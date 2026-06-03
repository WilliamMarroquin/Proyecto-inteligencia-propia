import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Ejecutamos el script de sincronización en un proceso de Node separado 
    // para evitar el bloqueo mutuo (deadlock) de conexiones TLS nativas en Turbopack (Windows)
    const scriptPath = path.join(process.cwd(), 'scripts', 'sync.mjs');
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`);
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    
    try {
      // El script devuelve el resultado en formato JSON en su última línea
      const lines = stdout.trim().split('\n');
      const result = JSON.parse(lines[lines.length - 1]);
      return NextResponse.json(result);
    } catch (parseError) {
      // Si no devolvió JSON, hubo un error de ejecución
      return NextResponse.json({ error: 'Error procesando correos', details: stdout || stderr }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error en sync:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
