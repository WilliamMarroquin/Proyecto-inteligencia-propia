import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Database, CheckCircle2, Clock } from "lucide-react";
import ExportButton from "@/components/ExportButton";

export const dynamic = "force-dynamic";

export default async function DatosPage() {
  const pagos = await prisma.pago.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="main-container">
      <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={28} color="var(--primary)" />
            <h1 className="title" style={{ margin: 0 }}>Base de Datos de Pagos</h1>
          </div>
        </div>
        <ExportButton pagos={pagos} />
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: '0', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '1.2rem 1rem', color: 'var(--secondary)', fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: '1.2rem 1rem', color: 'var(--secondary)', fontWeight: 600 }}>Monto</th>
              <th style={{ padding: '1.2rem 1rem', color: 'var(--secondary)', fontWeight: 600 }}>Fecha</th>
              <th style={{ padding: '1.2rem 1rem', color: 'var(--secondary)', fontWeight: 600 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pagos.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>
                  <Database size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                  No hay pagos registrados aún. Sincroniza correos para comenzar.
                </td>
              </tr>
            ) : (
              pagos.map((pago) => (
                <tr key={pago.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{pago.nombreCliente}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                    Q{pago.monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--secondary)' }}>{new Date(pago.fecha).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      backgroundColor: pago.estado === 'completado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                      color: pago.estado === 'completado' ? '#10b981' : '#f59e0b', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}>
                      {pago.estado === 'completado' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
