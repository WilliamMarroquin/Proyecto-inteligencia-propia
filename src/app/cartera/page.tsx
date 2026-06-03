"use client";

import { useEffect, useState } from "react";
import { Users, AlertTriangle, CheckCircle2, FileEdit } from "lucide-react";

export default function CarteraPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para modal de edición
  const [editingConvenio, setEditingConvenio] = useState<any>(null);
  const [nuevaCuota, setNuevaCuota] = useState("");

  const fetchClientes = async () => {
    setLoading(true);
    const res = await fetch("/api/clientes");
    const data = await res.json();
    setClientes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleEditCuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConvenio) return;
    
    await fetch("/api/convenios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ convenioId: editingConvenio.id, nuevaCuota })
    });
    
    setEditingConvenio(null);
    setNuevaCuota("");
    fetchClientes(); // refrescar
  };

  return (
    <div className="main-container">
      <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={28} color="var(--primary)" />
            <h1 className="title" style={{ margin: 0 }}>Control de Cartera y Convenios</h1>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: '0', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '1.2rem 1rem', color: 'var(--secondary)', fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: '1.2rem 1rem', color: 'var(--secondary)', fontWeight: 600 }}>Cuota Acordada</th>
              <th style={{ padding: '1.2rem 1rem', color: 'var(--secondary)', fontWeight: 600 }}>Total Pagado</th>
              <th style={{ padding: '1.2rem 1rem', color: 'var(--secondary)', fontWeight: 600 }}>Meses de Atraso</th>
              <th style={{ padding: '1.2rem 1rem', color: 'var(--secondary)', fontWeight: 600 }}>Estado</th>
              <th style={{ padding: '1.2rem 1rem', color: 'var(--secondary)', fontWeight: 600 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Cargando datos...</td></tr>
            ) : clientes.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No hay clientes registrados. (Sincroniza correos para generar el prototipo).</td></tr>
            ) : (
              clientes.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    {c.nombre}
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{c.email || 'Sin correo'}</div>
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                    Q{c.convenio ? c.convenio.montoCuota.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                    {c.convenio?.cuotaAnterior && (
                      <div style={{ fontSize: '0.75rem', opacity: 0.5, textDecoration: 'line-through' }}>
                        Q{c.convenio.cuotaAnterior.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                    Q{c.estadisticas.totalPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: c.estadisticas.mesesAtraso > 0 ? '#ef4444' : 'inherit', fontWeight: c.estadisticas.mesesAtraso > 0 ? 600 : 'normal' }}>
                    {c.estadisticas.mesesAtraso}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      backgroundColor: c.estadisticas.mesesAtraso === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: c.estadisticas.mesesAtraso === 0 ? '#10b981' : '#ef4444', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}>
                      {c.estadisticas.mesesAtraso === 0 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      {c.estadisticas.mesesAtraso === 0 ? 'Al Día' : 'En Mora'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {c.convenio && (
                      <button 
                        onClick={() => { setEditingConvenio(c.convenio); setNuevaCuota(c.convenio.montoCuota.toString()); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        <FileEdit size={14} /> Recalcular
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingConvenio && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--background)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Recalcular Cuota</h3>
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Modifica la cuota acordada en el convenio. El sistema guardará el registro anterior por motivos de auditoría.</p>
            <form onSubmit={handleEditCuota}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nueva Cuota (Q)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={nuevaCuota} 
                  onChange={e => setNuevaCuota(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--foreground)', color: 'var(--background)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingConvenio(null)} style={{ padding: '0.75rem 1rem', background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.75rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
