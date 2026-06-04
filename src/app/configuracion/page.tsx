import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Settings, Mail, Building, RefreshCw, KeyRound, AlertTriangle } from "lucide-react";

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
      tokenEmailUser: formData.get("tokenEmailUser") as string,
      tokenEmailPassword: formData.get("tokenEmailPassword") as string,
      tokenFirmaUrl: formData.get("tokenFirmaUrl") as string,
      tokenLeyenda: formData.get("tokenLeyenda") as string,
      alertaEmailUser: formData.get("alertaEmailUser") as string,
      alertaEmailPassword: formData.get("alertaEmailPassword") as string,
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

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <form action={saveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SECCIÓN 1: IMAP DE BANCOS */}
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <Mail size={24} color="#8b5cf6" /> Conexión IMAP (Lectura de Bancos)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Servidor IMAP</label>
                <input type="text" name="emailHost" defaultValue={config?.emailHost || 'imap.gmail.com'} className="input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correo Receptor</label>
                <input type="email" name="emailUser" defaultValue={config?.emailUser || ''} className="input" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contraseña de App</label>
                <input type="password" name="emailPassword" defaultValue={config?.emailPassword || ''} className="input" />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correo Remitente Banco</label>
                <input type="email" name="bankSender" defaultValue={config?.bankSender || ''} placeholder="ej. notificaciones@banco.com" className="input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Palabra Clave Asunto</label>
                <input type="text" name="emailKeyword" defaultValue={config?.emailKeyword || ''} className="input" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: TOKENS DE SEGURIDAD */}
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <KeyRound size={24} color="#10b981" /> Apartado 1: Correos del Sistema (Tokens 2FA)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correo Emisor (SMTP)</label>
                <input type="email" name="tokenEmailUser" defaultValue={config?.tokenEmailUser || ''} className="input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contraseña de App SMTP</label>
                <input type="password" name="tokenEmailPassword" defaultValue={config?.tokenEmailPassword || ''} className="input" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Leyenda de Bienvenida</label>
                <textarea name="tokenLeyenda" defaultValue={config?.tokenLeyenda || ''} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}></textarea>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>URL Imagen Firma</label>
                <input type="text" name="tokenFirmaUrl" defaultValue={config?.tokenFirmaUrl || ''} placeholder="https://..." className="input" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: RECORDATORIOS MORA */}
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <AlertTriangle size={24} color="#f59e0b" /> Apartado 2: Recordatorios de Mora (Automáticos)
            </h2>
            <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              El sistema redactará el mensaje automáticamente incluyendo los meses de atraso y saldos usando Inteligencia Artificial/Variables Automáticas. Solo debes proveer las credenciales de envío.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correo Emisor (SMTP)</label>
                <input type="email" name="alertaEmailUser" defaultValue={config?.alertaEmailUser || ''} className="input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contraseña de App SMTP</label>
                <input type="password" name="alertaEmailPassword" defaultValue={config?.alertaEmailPassword || ''} className="input" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn" style={{ marginTop: '1rem', padding: '1rem' }}>
            Guardar Toda la Configuración
          </button>
        </form>

        <form action="/api/sync" method="POST" style={{ marginTop: '2rem', textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <button type="submit" className="btn" style={{ backgroundColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={18} /> Probar Sincronización Manual de Banco
            </button>
        </form>
      </div>
    </div>
  );
}
