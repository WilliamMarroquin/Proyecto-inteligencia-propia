import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Settings, Mail, Building, RefreshCw } from "lucide-react";

export default async function ConfiguracionPage() {
  const config = await prisma.configuracion.findFirst();

  async function saveConfig(formData: FormData) {
    "use server";
    
    const data = {
      emailHost: formData.get("emailHost") as string,
      emailUser: formData.get("emailUser") as string,
      emailPassword: formData.get("emailPassword") as string,
      bankSender: formData.get("bankSender") as string,
      emailKeyword: formData.get("emailKeyword") as string,
    };

    const existing = await prisma.configuracion.findFirst();
    if (existing) {
      await prisma.configuracion.update({
        where: { id: existing.id },
        data
      });
    } else {
      await prisma.configuracion.create({ data });
    }
    
    revalidatePath("/configuracion");
  }

  return (
    <div className="main-container">
      <div className="header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={28} color="var(--primary)" />
          <h1 className="title" style={{ margin: 0 }}>Configuración del Sistema</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={24} color="#8b5cf6" />
          Conexión IMAP (Lectura de Correos)
        </h2>
        <form action={saveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Servidor IMAP</label>
            <input 
              type="text" 
              name="emailHost" 
              defaultValue={config?.emailHost || 'imap.gmail.com'}
              placeholder="ej. imap.gmail.com" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correo Electrónico (Usuario)</label>
            <input 
              type="email" 
              name="emailUser" 
              defaultValue={config?.emailUser || 'funcion710@gmail.com'}
              placeholder="tu@correo.com" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contraseña (App Password)</label>
            <input 
              type="password" 
              name="emailPassword" 
              defaultValue={config?.emailPassword || 'ebzn tpdz aeda shmg'}
              placeholder="••••••••••••" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={24} color="#10b981" />
            Filtros de Extracción
          </h2>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correo del Banco (Remitente)</label>
            <input 
              type="email" 
              name="bankSender" 
              defaultValue={config?.bankSender || ''}
              placeholder="ej. notificaciones@banco.com" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Palabra Clave (Opcional)</label>
            <input 
              type="text" 
              name="emailKeyword" 
              defaultValue={config?.emailKeyword || ''}
              placeholder="ej. Confirmación de Pago" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
            <small style={{ color: 'var(--secondary)' }}>El sistema solo descargará Excel de los correos que contengan esta palabra en el asunto.</small>
          </div>

          <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Guardar Configuración</button>
        </form>

        <form action="/api/sync" method="POST" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button type="submit" className="btn" style={{ backgroundColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={18} />
                Probar Sincronización Manual
            </button>
        </form>
      </div>
    </div>
  );
}
