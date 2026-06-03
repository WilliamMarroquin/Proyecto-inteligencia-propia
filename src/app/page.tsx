import { prisma } from "@/lib/prisma";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import DashboardChart from "@/components/DashboardChart";

export default async function Home() {
  // 1. Fetch KPI Data
  const totalPagos = await prisma.pago.count();
  
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

  // Group by date for the chart
  const chartDataMap: Record<string, number> = {};
  
  // Initialize last 7 days with 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    chartDataMap[dateStr] = 0;
  }

  recientes.forEach(pago => {
    const dateStr = new Date(pago.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    if (chartDataMap[dateStr] !== undefined) {
      chartDataMap[dateStr] += pago.monto;
    } else {
      chartDataMap[dateStr] = pago.monto;
    }
  });

  const chartData = Object.keys(chartDataMap).map(key => ({
    date: key,
    revenue: chartDataMap[key]
  }));

  // 3. Fetch Recent Transactions for the list
  const ultimasTransacciones = await prisma.pago.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="main-container" style={{ paddingTop: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Resumen Ejecutivo</h1>
        <p className="subtitle">Métricas y rendimiento financiero en tiempo real.</p>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Ingresos Último Lote</p>
              <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem' }}>Q{ingresosHoy.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
              <TrendingUp size={24} color="#10b981" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Sincronizado hoy
          </p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Transacciones Lote</p>
              <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem' }}>{transaccionesHoy}</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
              <Activity size={24} color="#3b82f6" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary)' }}>
            Nuevos registros procesados
          </p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Histórico</p>
              <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem' }}>Q{ingresosHistoricos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
              <DollarSign size={24} color="#8b5cf6" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary)' }}>
            En {totalPagos} transacciones totales
          </p>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Main Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Ingresos Últimos 7 Días</h3>
          <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.9rem' }}>Visión general del flujo de caja por día.</p>
          <DashboardChart data={chartData} />
        </div>

        {/* Recent Transactions */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Últimas Sincronizaciones</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {ultimasTransacciones.length === 0 ? (
              <p style={{ color: 'var(--secondary)', textAlign: 'center', marginTop: '2rem' }}>No hay datos recientes.</p>
            ) : (
              ultimasTransacciones.map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 500 }}>{tx.nombreCliente}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--secondary)' }}>{new Date(tx.fecha).toLocaleDateString()}</p>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
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
