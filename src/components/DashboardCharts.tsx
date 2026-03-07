import React, { useMemo } from 'react';
import { useAppContext } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export function DashboardCharts() {
  const { orders, productionStatuses } = useAppContext();

  const activeOrders = useMemo(() => {
    return orders.filter(o => !o.archived && !o.deleted && !o.finalized && !o.isQuotation);
  }, [orders]);

  const statusData = useMemo(() => {
    return productionStatuses.map(status => {
      const count = activeOrders.filter(o => o.status.toLowerCase() === status.label.toLowerCase()).length;
      return {
        name: status.label,
        qnt: count,
      };
    });
  }, [activeOrders, productionStatuses]);

  const paymentData = useMemo(() => {
    const paymentCounts = activeOrders.reduce((acc, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(paymentCounts).map(([name, count]) => ({
      name,
      value: count,
    }));
  }, [activeOrders]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="card-3d p-6 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80"></div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
          Pedidos por Status
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQnt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                angle={-10}
                textAnchor="end"
                height={40}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9', radius: 4 }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(4px)',
                  padding: '8px 12px'
                }}
                itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}
              />
              <Bar 
                dataKey="qnt" 
                name="Quantidade" 
                fill="url(#colorQnt)" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-3d p-6 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80"></div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          Status de Pagamento
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(4px)',
                  padding: '8px 12px'
                }}
                itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
