"use client";

import { Download } from "lucide-react";

export default function DownloadReportBtn({ data }: { data: any }) {
  const handleDownload = () => {
    alert("Generando reporte... (Aquí se implementará la lógica con jspdf o xlsx)");
    // Aquí podemos añadir la generación del PDF más adelante si se requiere
  };

  return (
    <button onClick={handleDownload} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
      <Download size={18} />
      Exportar Reporte Mensual
    </button>
  );
}
