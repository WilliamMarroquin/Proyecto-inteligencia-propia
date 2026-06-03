import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST() {
  try {
    if (process.env.NODE_ENV === 'development') {
      // Desarrollo local (Windows): Usamos child_process para evitar el deadlock de Turbopack con IMAPFlow
      const scriptPath = path.join(process.cwd(), 'scripts', 'sync.mjs');
      const { stdout, stderr } = await execAsync(`node "${scriptPath}"`);
      
      if (stderr && !stdout) {
        throw new Error(stderr);
      }
      
      try {
        const lines = stdout.trim().split('\n');
        const result = JSON.parse(lines[lines.length - 1]);
        return NextResponse.json(result);
      } catch (parseError) {
        return NextResponse.json({ error: 'Error procesando correos', details: stdout || stderr }, { status: 500 });
      }
    } else {
      // Producción (Vercel): Importamos e invocamos la función directamente.
      // Esto obliga al "Vercel Build" a incluir todas las dependencias (imapflow, cloudinary) en el paquete Serverless.
      const { runSync } = await import('../../../../scripts/sync.mjs');
      const result = await runSync();
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error('Error en sync:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
