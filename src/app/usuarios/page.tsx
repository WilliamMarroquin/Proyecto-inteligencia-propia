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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{editingId ? "Editar Usuario" : "Crear Nuevo Usuario"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label className="label">Nombres</label><input type="text" className="input" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required /></div>
                <div><label className="label">Apellidos</label><input type="text" className="input" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} /></div>
                <div><label className="label">Correo Electrónico</label><input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
                <div><label className="label">Teléfono</label><input type="text" className="input" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>
                <div>
                  <label className="label">Contraseña {editingId && "(Dejar en blanco para no cambiar)"}</label>
                  <input type="password" className="input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingId} />
                </div>
                <div>
                  <label className="label">URL Fotografía</label>
                  <input type="text" className="input" placeholder="https://..." value={formData.fotografia} onChange={e => setFormData({...formData, fotografia: e.target.value})} />
                </div>
                <div>
                  <label className="label">Rol en el Sistema</label>
                  <select className="input" value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                    <option value="SUPER_ADMIN">Super Administrador</option>
                    <option value="JEFE">Jefe de Área</option>
                    <option value="ASISTENTE">Asistente</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="label">Estado</label>
                  <select className="input" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Permisos Modulares (Visibilidad)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {AVAILABLE_PERMISSIONS.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.permisos.includes(p.id)}
                      onChange={() => handlePermissionChange(p.id)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    {p.label}
                  </label>
                ))}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' }}>Cancelar</button>
                <button type="submit" className="btn">Guardar Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
