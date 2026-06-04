import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Settings, Mail, Building, RefreshCw, KeyRound, AlertTriangle } from "lucide-react";
import FileUploadInput from "@/components/FileUploadInput";

export default async function ConfiguracionPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const currentTab = searchParams.tab || 'bancos';
  const config = await prisma.configuracion.findFirst();

  async function saveConfig(formData: FormData) {
    "use server";
    
    const data = {
      emailHost: formData.get("emailHost") as string || config?.emailHost || 'imap.gmail.com',
      emailUser: formData.get("emailUser") as string || config?.emailUser || '',
      emailPassword: formData.get("emailPassword") as string || config?.emailPassword || '',
      bankSender: formData.get("bankSender") as string || config?.bankSender || '',
      emailKeyword: formData.get("emailKeyword") as string || config?.emailKeyword || '',
      tokenEmailUser: formData.get("tokenEmailUser") as string || config?.tokenEmailUser || '',
      tokenEmailPassword: formData.get("tokenEmailPassword") as string || config?.tokenEmailPassword || '',
      tokenFirmaUrl: formData.get("tokenFirmaUrl") as string || config?.tokenFirmaUrl || '',
      tokenLeyenda: formData.get("tokenLeyenda") as string || config?.tokenLeyenda || '',
      alertaEmailUser: formData.get("alertaEmailUser") as string || config?.alertaEmailUser || '',
      alertaEmailPassword: formData.get("alertaEmailPassword") as string || config?.alertaEmailPassword || '',
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

  const TabButton = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = currentTab === id;
    return (
      <Link 
        href={`?tab=${id}`} 
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem',
          borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
          color: isActive ? 'var(--primary)' : 'var(--secondary)',
          fontWeight: isActive ? 600 : 500,
          textDecoration: 'none',
          transition: 'all 0.2s'
        }}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  };

  return (
    <div className="main-container">
      <div className="header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={28} color="var(--primary)" />
          <h1 className="title" style={{ margin: 0 }}>Panel de Ajustes Maestros</h1>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem', overflowX: 'auto', maxWidth: '800px', margin: '0 auto', paddingBottom: '0.5rem' }}>
        <TabButton id="bancos" icon={Mail} label="Conexión Bancaria" />
        <TabButton id="tokens" icon={KeyRound} label="Tokens de Seguridad" />
        <TabButton id="mora" icon={AlertTriangle} label="Motor de Recordatorios" />
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem' }}>
        <form action={saveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {currentTab === 'bancos' && (
            <div className="fade-in">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <Mail size={24} color="#8b5cf6" /> Interfaz de Lectura Bancaria Automática
              </h2>
              <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                Conecta el buzón seguro de la institución para que la Inteligencia Artificial procese los comprobantes automáticamente.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Proveedor en la Nube (Gateway)</label>
                  <select name="emailHost" defaultValue={config?.emailHost || 'imap.gmail.com'} className="input">
                    <option value="imap.gmail.com">Google Cloud (Workspace / Gmail)</option>
                    <option value="outlook.office365.com">Microsoft Azure (Office 365 / Outlook)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Buzón Receptor</label>
                  <input type="email" name="emailUser" defaultValue={config?.emailUser || ''} placeholder="finanzas@tuempresa.com" className="input" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Clave de Cifrado (App Password)</label>
                  <input type="password" name="emailPassword" defaultValue={config?.emailPassword || ''} placeholder="••••••••••••••••" className="input" />
                </div>
              </div>
              
              <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--primary)' }}>Filtros de Extracción</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correo Remitente Oficial del Banco</label>
                  <input type="email" name="bankSender" defaultValue={config?.bankSender || ''} placeholder="notificaciones@banco.com" className="input" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Asunto o Etiqueta Clave</label>
                  <input type="text" name="emailKeyword" defaultValue={config?.emailKeyword || ''} placeholder="Liquidacion de pagos" className="input" />
                </div>
              </div>

              <div style={{ marginTop: '3rem', textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                <button formAction="/api/sync" formMethod="POST" className="btn" style={{ backgroundColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={18} /> Iniciar Lectura Manual del Buzón
                </button>
              </div>
            </div>
          )}

          {currentTab === 'tokens' && (
            <div className="fade-in">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <KeyRound size={24} color="#10b981" /> Motor de Correos del Sistema (Tokens 2FA)
              </h2>
              <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                Configura desde dónde se enviarán los códigos de verificación temporal para los ingresos de empleados al sistema.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Canal Emisor (SMTP)</label>
                  <input type="email" name="tokenEmailUser" defaultValue={config?.tokenEmailUser || ''} placeholder="seguridad@tuempresa.com" className="input" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Clave del Canal</label>
                  <input type="password" name="tokenEmailPassword" defaultValue={config?.tokenEmailPassword || ''} className="input" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Leyenda Corporativa de Bienvenida</label>
                  <textarea name="tokenLeyenda" defaultValue={config?.tokenLeyenda || ''} rows={4} placeholder="Estás ingresando al sistema central de datos..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}></textarea>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FileUploadInput 
                    name="tokenFirmaUrl" 
                    defaultValue={config?.tokenFirmaUrl || ''} 
                    label="Sello o Firma Digital (Subir Archivo)"
                  />
                </div>
              </div>
            </div>
          )}

          {currentTab === 'mora' && (
            <div className="fade-in">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <AlertTriangle size={24} color="#f59e0b" /> Automatización de Carteras Vencidas
              </h2>
              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '1rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ color: '#d97706', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
                  La Inteligencia Artificial se encargará de redactar e insertar automáticamente los meses de atraso y el cálculo exacto de la deuda de cada cliente moroso. Solo necesitas configurar el correo que dará la cara por UDEVIPO.
                </p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Buzón Emisor de Cobranza (SMTP)</label>
                  <input type="email" name="alertaEmailUser" defaultValue={config?.alertaEmailUser || ''} placeholder="cartera@udevipo.com" className="input" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Clave del Buzón</label>
                  <input type="password" name="alertaEmailPassword" defaultValue={config?.alertaEmailPassword || ''} className="input" />
                </div>
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn" style={{ padding: '0.75rem 2rem' }}>
              Guardar Configuración Activa
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
