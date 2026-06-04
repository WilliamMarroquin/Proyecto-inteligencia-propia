"use client";

import { useState } from "react";
import { UploadCloud, Check } from "lucide-react";

interface FileUploadInputProps {
  name: string;
  defaultValue: string;
  label: string;
}

export default function FileUploadInput({ name, defaultValue, label }: FileUploadInputProps) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState(defaultValue);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setUrl(data.url);
      } else {
        alert("Error al subir archivo");
      }
    } catch (err) {
      alert("Error de conexión al subir");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontWeight: 500 }}>{label}</label>
      
      {/* Input oculto que envía el valor final al formulario (Server Action) */}
      <input type="hidden" name={name} value={url} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {url && (
          <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', backgroundColor: 'white' }}>
            <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        )}
        
        <label className="btn" style={{ cursor: 'pointer', backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading ? "Subiendo..." : <><UploadCloud size={18} /> Subir Archivo Local</>}
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
        </label>
        
        {url && !loading && <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}><Check size={16} /> Subido</span>}
      </div>
    </div>
  );
}
