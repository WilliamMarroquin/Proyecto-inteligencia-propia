"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // 1: Credenciales, 2: OTP
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = step === 1 
        ? { email, password } 
        : { email, otp };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.step === "2fa") {
          setStep(2);
        } else if (data.success) {
          window.location.href = "/"; // Forzar recarga para que el middleware tome el JWT
        }
      } else {
        setError(data.error || "Ocurrió un error");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
      <div style={{ background: 'var(--card)', padding: '3rem', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <ShieldCheck size={56} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--foreground)', fontSize: '1.75rem' }}>Finasist AI</h1>
        
        {step === 1 ? (
          <p style={{ color: 'var(--secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>Acceso corporativo seguro</p>
        ) : (
          <p style={{ color: 'var(--secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Hemos enviado un código de 6 dígitos a <br/><strong>{email}</strong>
          </p>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {step === 1 && (
            <>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="Correo Electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none' }}
                  required
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} color="var(--primary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Solo números
                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '8px', border: '2px solid var(--primary)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center', outline: 'none', fontWeight: 700 }}
                required
                autoFocus
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '0.5rem',
              width: '100%', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: 'none', 
              background: 'var(--primary)', 
              color: 'white', 
              fontSize: '1rem', 
              fontWeight: 600, 
              cursor: loading ? 'not-allowed' : 'pointer', 
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading 
              ? (step === 1 ? "Verificando..." : "Iniciando sesión...") 
              : (step === 1 ? "Continuar" : "Verificar Código")
            }
          </button>

          {step === 2 && (
            <button 
              type="button"
              onClick={() => { setStep(1); setOtp(""); setError(""); }}
              style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}
            >
              Volver al login
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
