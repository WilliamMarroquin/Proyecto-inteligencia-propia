"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, Check, Trash2, Edit, X } from "lucide-react";
import { formatToGuatemalaDate } from "@/lib/dateUtils";

const AVAILABLE_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard (Resumen)" },
  { id: "cartera", label: "Cartera y Morosidad" },
  { id: "archivos", label: "Archivos en la Nube" },
  { id: "datos", label: "Base de Datos Raw" },
  { id: "ia", label: "Inteligencia Artificial (Chat)" },
  { id: "ajustes", label: "Configuración del Sistema" },
  { id: "usuarios", label: "Gestión de Usuarios" },
  { id: "auditoria", label: "Auditoría (Anti-Fraude)" }
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    password: "",
    fotografia: "",
    rol: "ASISTENTE",
    permisos: [] as string[],
    estado: "activo"
  });

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      setUsuarios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handlePermissionChange = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permisos: prev.permisos.includes(id) 
        ? prev.permisos.filter(p => p !== id)
        : [...prev.permisos, id]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/usuarios/${editingId}` : '/api/usuarios';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchUsuarios();
      } else {
        alert("Error al guardar usuario");
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
      fetchUsuarios();
    } catch (e) {
      alert("Error eliminando");
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ nombre: "", apellidos: "", email: "", telefono: "", password: "", fotografia: "", rol: "ASISTENTE", permisos: ["dashboard", "cartera"], estado: "activo" });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditingId(u.id);
    setFormData({
      nombre: u.nombre, apellidos: u.apellidos || "", email: u.email, telefono: u.telefono || "",
      password: "", fotografia: u.fotografia || "", rol: u.rol, permisos: u.permisos || [], estado: u.estado
    });
    setShowModal(true);
  };

  return (
    <div className="main-container">
      <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={28} color="var(--primary)" />
          <h1 className="title" style={{ margin: 0 }}>Gestión de Usuarios</h1>
        </div>
        <button onClick={openNew} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '1rem', color: 'var(--secondary)' }}>Usuario</th>
              <th style={{ padding: '1rem', color: 'var(--secondary)' }}>Contacto</th>
              <th style={{ padding: '1rem', color: 'var(--secondary)' }}>Rol</th>
              <th style={{ padding: '1rem', color: 'var(--secondary)' }}>Permisos</th>
              <th style={{ padding: '1rem', color: 'var(--secondary)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</td></tr>
            ) : usuarios.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {u.fotografia ? <img src={u.fotografia} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} color="var(--secondary)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.nombre} {u.apellidos}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Creado: {formatToGuatemalaDate(u.createdAt)}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                  <div>{u.email}</div>
                  <div style={{ color: 'var(--secondary)' }}>{u.telefono}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {u.rol}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--secondary)', maxWidth: '200px' }}>
                  {u.permisos.length} módulos habilitados
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => openEdit(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.5rem' }}><Edit size={18} /></button>
                  <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.5rem' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: 0, display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px' }}>
                  {editingId ? <Edit size={20} /> : <UserPlus size={20} />}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingId ? "Editar Perfil de Usuario" : "Crear Nuevo Usuario"}</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', color: 'var(--secondary)' }}><X size={20} /></button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Información Personal y Foto */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                
                {/* Columna Foto */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--background)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', overflow: 'hidden', backgroundColor: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {formData.fotografia ? (
                      <img src={formData.fotografia} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Users size={48} color="var(--secondary)" />
                    )}
                  </div>
                  <label className="btn" style={{ width: '100%', textAlign: 'center', cursor: 'pointer', backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                    {loading ? "Subiendo..." : "Subir Fotografía"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setLoading(true);
                        const formDataPayload = new FormData();
                        formDataPayload.append('file', file);
                        try {
                          const res = await fetch('/api/upload', { method: 'POST', body: formDataPayload });
                          const data = await res.json();
                          if (data.url) setFormData(prev => ({ ...prev, fotografia: data.url }));
                          else alert("Error al subir imagen");
                        } catch (err) {
                          alert("Error de conexión al subir");
                        } finally {
                          setLoading(false);
                        }
                      }}
                    />
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', textAlign: 'center', margin: 0 }}>Recomendado: 400x400px (JPG/PNG)</p>
                </div>

                {/* Columna Datos Personales */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignContent: 'start' }}>
                  <h3 style={{ gridColumn: '1 / -1', margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--foreground)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Datos Personales</h3>
                  
                  <div><label className="label">Nombres *</label><input type="text" className="input" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required placeholder="Ej. Juan Carlos" /></div>
                  <div><label className="label">Apellidos *</label><input type="text" className="input" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} required placeholder="Ej. Pérez" /></div>
                  
                  <div><label className="label">Correo Electrónico *</label><input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="juan@empresa.com" /></div>
                  <div><label className="label">Teléfono</label><input type="text" className="input" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} placeholder="+502 12345678" /></div>
                </div>
              </div>

              {/* Roles y Seguridad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ gridColumn: '1 / -1', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Rol y Seguridad</h3>
                
                <div>
                  <label className="label">Contraseña {editingId && <span style={{fontSize:'0.8em', color:'var(--secondary)'}}>(Opcional)</span>}</label>
                  <input type="password" className="input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingId} placeholder={editingId ? "Dejar en blanco para conservar" : "Contraseña segura"} />
                </div>
                
                <div>
                  <label className="label">Rol en el Sistema</label>
                  <select className="input" value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                    <option value="SUPER_ADMIN">🌟 Super Administrador</option>
                    <option value="JEFE">👔 Jefe de Área</option>
                    <option value="ASISTENTE">💼 Asistente / Operador</option>
                    <option value="AUDITOR">🛡️ Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="label">Estado de la Cuenta</label>
                  <select className="input" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} style={{ borderColor: formData.estado === 'activo' ? 'var(--primary)' : '#ef4444' }}>
                    <option value="activo">🟢 Activo (Puede ingresar)</option>
                    <option value="inactivo">🔴 Inactivo (Bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* Permisos Modulares */}
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} color="var(--primary)"/> Permisos Modulares (Visibilidad de Pantallas)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {AVAILABLE_PERMISSIONS.map(p => (
                    <label key={p.id} style={{ 
                      display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer',
                      padding: '1rem', borderRadius: '8px', border: `1px solid ${formData.permisos.includes(p.id) ? 'var(--primary)' : 'var(--border)'}`,
                      backgroundColor: formData.permisos.includes(p.id) ? 'rgba(139, 92, 246, 0.05)' : 'var(--background)',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ 
                        width: '24px', height: '24px', borderRadius: '6px', border: `2px solid ${formData.permisos.includes(p.id) ? 'var(--primary)' : 'var(--secondary)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: formData.permisos.includes(p.id) ? 'var(--primary)' : 'transparent'
                      }}>
                        {formData.permisos.includes(p.id) && <Check size={16} color="white" strokeWidth={3} />}
                      </div>
                      <span style={{ fontWeight: formData.permisos.includes(p.id) ? 600 : 400, color: formData.permisos.includes(p.id) ? 'var(--foreground)' : 'var(--secondary)' }}>
                        {p.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>Cancelar Operación</button>
                <button type="submit" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}>
                  {editingId ? <Edit size={18} /> : <UserPlus size={18} />}
                  {editingId ? "Actualizar Usuario" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
