"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Database, Settings, ShieldCheck, FileSpreadsheet, Users } from "lucide-react";

export default function TopNav() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const navItems = [
    { name: "Dashboard", href: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Cartera", href: "/cartera", icon: <Users size={20} /> },
    { name: "Archivos", href: "/archivos", icon: <FileSpreadsheet size={20} /> },
    { name: "Datos", href: "/datos", icon: <Database size={20} /> },
    { name: "Ajustes", href: "/configuracion", icon: <Settings size={20} /> },
  ];

  return (
    <header style={{ 
      backgroundColor: 'var(--card-bg)', 
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 2rem'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'var(--foreground)' }}>
          <img src="/logo.png" alt="Finasist AI Logo" style={{ height: '40px', objectFit: 'contain' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>FINASIST AI</span>
        </Link>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? 'white' : 'var(--secondary)',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s'
                }}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
