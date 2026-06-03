import { PrismaClient } from "@prisma/client";
import { FileSpreadsheet, Download, Calendar } from "lucide-react";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic"; // Ensure it fetches fresh data

export default async function ArchivosPage() {
  const archivos = await prisma.respaldoExcel.findMany({
    orderBy: { fecha: 'desc' }
  });

  return (
    <div className="main-container">
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 className="title">Respaldos en la Nube</h1>
        <p style={{ color: 'var(--secondary)' }}>
          Aquí encontrarás todos los archivos Excel extraídos de los correos del banco.
          Estos archivos están almacenados de forma segura y encriptada en los servidores en la nube.
        </p>
      </div>

      {archivos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FileSpreadsheet size={48} color="var(--secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.5rem 0' }}>No hay archivos todavía</h2>
          <p style={{ color: 'var(--secondary)', margin: 0 }}>
            Los archivos Excel aparecerán aquí en cuanto el sistema sincronice nuevos correos.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {archivos.map((archivo) => (
            <div key={archivo.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                  padding: '1rem', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileSpreadsheet size={32} color="#10b981" />
                </div>
                
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={archivo.nombre}>
                    {archivo.nombre}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--secondary)', fontSize: '0.8rem' }}>
                    <Calendar size={14} />
                    {new Date(archivo.fecha).toLocaleDateString('es-ES', { 
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <a 
                  href={archivo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%', textDecoration: 'none' }}
                >
                  <Download size={18} /> Descargar Excel
                </a>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
