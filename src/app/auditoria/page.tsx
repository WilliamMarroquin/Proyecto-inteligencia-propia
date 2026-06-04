"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Search, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { formatToGuatemalaDateTime } from "@/lib/dateUtils";

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auditoria');
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Error cargando auditoría", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="main-container">
      <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={28} color="#ef4444" />
            <h1 className="title" style={{ margin: 0 }}>Bitácora de Auditoría</h1>
          </div>
          <p style={{ color: 'var(--secondary)', margin: '0.5rem 0 0 0' }}>Registro inmutable de seguridad y operaciones del sistema.</p>
        </div>
        <button onClick={fetchLogs} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '1rem', color: 'var(--secondary)' }}>Fecha y Hora</th>
              <th style={{ padding: '1rem', color: 'var(--secondary)' }}>Usuario</th>
              <th style={{ padding: '1rem', color: 'var(--secondary)' }}>Acción</th>
              <th style={{ padding: '1rem', color: 'var(--secondary)' }}>Detalles del Evento</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>Cargando bitácora de seguridad...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>No hay eventos registrados.</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--secondary)', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CalendarIcon size={14} /> {formatToGuatemalaDateTime(log.createdAt)}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {log.usuario ? (
                    <div style={{ fontWeight: 500 }}>
                      {log.usuario.nombre} {log.usuario.apellidos}
                      <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{log.usuario.email}</div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--secondary)', fontStyle: 'italic' }}>Sistema</span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    backgroundColor: log.accion === 'LOGIN' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                    color: log.accion === 'LOGIN' ? '#3b82f6' : '#f59e0b', 
                    borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 
                  }}>
                    {log.accion}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                  {log.detalles}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
