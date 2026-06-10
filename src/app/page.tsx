import { prisma } from "@/lib/prisma";
import { TrendingUp, Users, DollarSign, Activity, FileText, PieChart as PieChartIcon } from "lucide-react";
import { RevenueAreaChart, TransactionBarChart, HealthPieChart } from "@/components/DashboardCharts";
import DownloadReportBtn from "@/components/DownloadReportBtn";
import { formatToGuatemalaDate } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Fetch Basic KPI Data
  const totalPagos = await prisma.pago.count();
  const totalClientes = await prisma.cliente.count();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const transaccionesHoy = await prisma.pago.count({
    where: { createdAt: { gte: today } }
  });

  const sumaTotalAggregate = await prisma.pago.aggregate({
    _sum: { monto: true }
  });
  const ingresosHistoricos = sumaTotalAggregate._sum.monto || 0;

  const sumaHoyAggregate = await prisma.pago.aggregate({
    _sum: { monto: true },
    where: { createdAt: { gte: today } }
  });
  const ingresosHoy = sumaHoyAggregate._sum.monto || 0;

  // 2. Fetch Chart Data (Last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recientes = await prisma.pago.findMany({
    where: { fecha: { gte: sevenDaysAgo } },
    orderBy: { fecha: 'asc' }
  });

  // Group by date for the charts (Revenue and Count)
  const chartDataMap: Record<string, { revenue: number, count: number }> = {};
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    chartDataMap[dateStr] = { revenue: 0, count: 0 };
  }

  recientes.forEach(pago => {
    const dateStr = new Date(pago.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    if (chartDataMap[dateStr] !== undefined) {
      chartDataMap[dateStr].revenue += pago.monto;
      chartDataMap[dateStr].count += 1;
    } else {
      chartDataMap[dateStr] = { revenue: pago.monto, count: 1 };
    }
  });

  const timelineData = Object.keys(chartDataMap).map(key => ({
    date: key,
    revenue: chartDataMap[key].revenue,
    count: chartDataMap[key].count
  }));

  // 3. Health of Cartera (Convenios Status)
  const convenios = await prisma.convenio.groupBy({
    by: ['estado'],
    _count: { estado: true }
  });
  
  const statusLabels: any = { 'activo': 'Al Día', 'moroso': 'En Mora', 'cancelado': 'Saldados' };
  const healthData = convenios.map(c => ({
    name: statusLabels[c.estado] || c.estado,
    value: c._count.estado
  }));

  // 4. Fetch Recent Transactions for the list
  const ultimasTransacciones = await prisma.pago.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="main-container" style={{ paddingTop: '2rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Resumen Ejecutivo</h1>
          <p className="subtitle">Métricas corporativas e indicadores clave en tiempo real.</p>
        </div>
        <DownloadReportBtn data={{ timelineData, healthData, ingresosHoy, ingresosHistoricos }} />
      </header>

      {/* KPI Cards (Grid de 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Ingresos Hoy</p>
              <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem' }}>Q{ingresosHoy.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
              <TrendingUp size={20} color="#10b981" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#10b981' }}>Procesado automáticamente</p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Transacciones (Lote)</p>
              <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem' }}>{transaccionesHoy}</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
              <Activity size={20} color="#3b82f6" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--secondary)' }}>Sincronizaciones de hoy</p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Clientes</p>
              <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem' }}>{totalClientes}</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
              <Users size={20} color="#f59e0b" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--secondary)' }}>Cartera registrada</p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Ingreso Histórico</p>
              <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.75rem' }}>Q{ingresosHistoricos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
              <DollarSign size={20} color="#8b5cf6" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--secondary)' }}>Acumulado total</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Gráfica de Ingresos */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--primary)" /> Ingresos (Últimos 7 Días)
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--secondary)', fontSize: '0.85rem' }}>Flujo de caja consolidado por día.</p>
          <RevenueAreaChart data={timelineData} />
        </div>

        {/* Gráfica de Transacciones */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#3b82f6" /> Volumen Operativo
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--secondary)', fontSize: '0.85rem' }}>Cantidad de transacciones procesadas por día.</p>
          <TransactionBarChart data={timelineData} />
        </div>
      </div>

      {/* Secondary Grid (Pie Chart + List) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Salud de Cartera (Pie Chart) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChartIcon size={18} color="#10b981" /> Estado de la Cartera
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--secondary)', fontSize: '0.85rem' }}>Distribución de convenios según su estatus.</p>
          <HealthPieChart data={healthData} />
        </div>

        {/* Recent Transactions */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--foreground)" /> Últimas Sincronizaciones
          </h3>
          <p style={{ margin: '0 0 1.5rem 0', color: 'var(--secondary)', fontSize: '0.85rem' }}>Auditoría rápida de los ingresos recientes.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {ultimasTransacciones.length === 0 ? (
              <p style={{ color: 'var(--secondary)', textAlign: 'center', marginTop: '2rem' }}>No hay datos recientes.</p>
            ) : (
              ultimasTransacciones.map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 500, fontSize: '0.95rem' }}>{tx.nombreCliente}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--secondary)' }}>{formatToGuatemalaDate(tx.fecha)}</p>
                  </div>
                  <div style={{ fontWeight: 600, color: '#10b981', fontSize: '0.95rem' }}>
                    +Q{tx.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
