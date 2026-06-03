"use client";

import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportButton({ pagos }: { pagos: any[] }) {
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título y encabezado
    doc.setFontSize(20);
    doc.text("Reporte de Pagos - Órbita", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total de registros: ${pagos.length}`, 14, 36);

    // Preparar datos para la tabla
    const tableData = pagos.map(pago => [
      pago.nombreCliente,
      `Q${pago.monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      new Date(pago.fecha).toLocaleDateString(),
      pago.estado
    ]);

    // Calcular totales
    const sumaTotal = pagos.reduce((acc, curr) => acc + curr.monto, 0);
    tableData.push([
      "TOTAL",
      `Q${sumaTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "",
      ""
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["Cliente", "Monto", "Fecha", "Estado"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      didParseCell: function(data) {
        // Estilo para la fila de totales
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });

    doc.save("Reporte_Pagos_Orbita.pdf");
  };

  return (
    <button onClick={exportToPDF} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#10b981' }}>
      <Download size={18} />
      Exportar a PDF
    </button>
  );
}
