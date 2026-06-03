"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        setError("Contraseña incorrecta");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
      <div style={{ background: 'var(--card)', padding: '3rem', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--foreground)' }}>Finasist AI</h1>
        <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>Acceso seguro para administradores</p>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Contraseña Maestra"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', marginBottom: '1.5rem', fontSize: '1rem', outline: 'none' }}
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
          >
            {loading ? "Verificando..." : "Entrar al Sistema"}
          </button>
        </form>
        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--secondary)' }}>
          *Para este prototipo, la contraseña es: <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
}
