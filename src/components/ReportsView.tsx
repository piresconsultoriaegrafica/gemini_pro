import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../store';
import { IconContainer } from './IconContainer';
import { Printer, Download, FileText, Filter, Calendar, DollarSign, Package, CreditCard, BarChart2, List } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { calculateOrderTotal, calculateItemTotal, calculateOrderProfit, calculateItemCost } from '../utils';
import { format, isAfter, isBefore, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export function ReportsView() {
  const { orders, companyInfo } = useAppContext();
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('chart');
  
  const printRef = useRef<HTMLDivElement>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.isQuotation) return false;
      const orderDate = parseISO(order.createdAt);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      const isWithinDateRange = (!startDate || isAfter(orderDate, start) || format(orderDate, 'yyyy-MM-dd') === startDate) &&
                                (!endDate || isBefore(orderDate, end) || format(orderDate, 'yyyy-MM-dd') === endDate);
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentMethodFilter === 'all' || order.paymentMethod === paymentMethodFilter;
      
      return isWithinDateRange && matchesStatus && matchesPayment;
    });
  }, [orders, startDate, endDate, statusFilter, paymentMethodFilter]);

  // Faturamento Total (Líquido - o que foi efetivamente vendido)
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0);
  
  // Faturamento Bruto (sem descontos)
  const totalGrossRevenue = filteredOrders.reduce((sum, order) => {
    return sum + (order.items || []).reduce((itemSum, item) => itemSum + calculateItemTotal(item), 0);
  }, 0);

  const totalCost = filteredOrders.reduce((sum, order) => {
    return sum + (order.items || []).reduce((itemSum, item) => itemSum + calculateItemCost(item), 0);
  }, 0);
  
  // Total de descontos
  const totalDiscount = totalGrossRevenue - totalRevenue;

  // Lucro = Valor de Venda (Bruto) - Valor de Custo - Desconto
  const totalProfit = totalGrossRevenue - totalCost - totalDiscount;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const totalPaid = filteredOrders.reduce((sum, order) => sum + (order.amountPaid || 0), 0);
  const totalPending = totalRevenue - totalPaid;

  const productsSold = useMemo(() => {
    const products: Record<string, { quantity: number, revenue: number }> = {};
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!products[item.name]) {
          products[item.name] = { quantity: 0, revenue: 0 };
        }
        products[item.name].quantity += item.quantity;
        products[item.name].revenue += calculateItemTotal(item);
      });
    });
    return Object.entries(products).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredOrders]);

  const paymentMethods = useMemo(() => {
    const methods: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const method = order.paymentMethod || 'Não informado';
      methods[method] = (methods[method] || 0) + (order.amountPaid || 0);
    });
    return Object.entries(methods).sort((a, b) => b[1] - a[1]);
  }, [filteredOrders]);

  const revenueOverTime = useMemo(() => {
    const dailyRevenue: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const date = format(parseISO(order.createdAt), 'dd/MM/yyyy');
      dailyRevenue[date] = (dailyRevenue[date] || 0) + calculateOrderTotal(order);
    });
    
    return Object.entries(dailyRevenue)
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a[0].split('/');
        const [dayB, monthB, yearB] = b[0].split('/');
        return new Date(`${yearA}-${monthA}-${dayA}`).getTime() - new Date(`${yearB}-${monthB}-${dayB}`).getTime();
      })
      .map(([date, revenue]) => ({ date, revenue }));
  }, [filteredOrders]);

  const handlePrint = () => {
    if (!printRef.current) return;

    const isDirectPrint = companyInfo?.directPrint;
    const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
    const title = `relatorio_financeiro_${dateStr}`;

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          ${isDirectPrint ? `
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 0; }
            }
          </style>
          ` : ''}
        </head>
        <body>
          ${printRef.current.innerHTML}
          ${!isDirectPrint ? `
          <script>
            // Wait for Tailwind to process
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
          ` : ''}
        </body>
      </html>
    `;

    if (isDirectPrint) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      iframe.contentDocument?.write(html);
      iframe.contentDocument?.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    } else {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    }
  };

  const handleExportExcel = async () => {
    const data = filteredOrders.map(o => {
      const total = calculateOrderTotal(o);
      return {
        'Data': format(parseISO(o.createdAt), 'dd/MM/yyyy HH:mm'),
        'Cliente': o.customerName,
        'Status': o.status,
        'Pagamento': o.paymentStatus,
        'Método': o.paymentMethod || '-',
        'Total': total,
        'Pago': o.amountPaid || 0,
        'Pendente': total - (o.amountPaid || 0)
      };
    });
    const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
    await exportToExcel(data, `relatorio_financeiro_${dateStr}`);
  };

  const handleExportPDF = async () => {
    const headers = ['Data', 'Cliente', 'Status', 'Pagamento', 'Método', 'Total', 'Pago', 'Pendente'];
    const data = filteredOrders.map(o => {
      const total = calculateOrderTotal(o);
      return [
        format(parseISO(o.createdAt), 'dd/MM/yyyy HH:mm'),
        o.customerName,
        o.status,
        o.paymentStatus,
        o.paymentMethod || '-',
        `R$ ${total.toFixed(2)}`,
        `R$ ${(o.amountPaid || 0).toFixed(2)}`,
        `R$ ${(total - (o.amountPaid || 0)).toFixed(2)}`
      ];
    });
    const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
    await exportToPDF('Relatório Financeiro', headers, data, `relatorio_financeiro_${dateStr}`, companyInfo);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Relatórios</h2>
          <p className="text-sm text-slate-500 mt-1">Análise financeira e de vendas.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 mr-2">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-indigo-50 shadow-sm text-indigo-600 ring-1 ring-indigo-400' : 'text-slate-400 bg-slate-200 hover:bg-slate-300 hover:text-slate-600'}`}
              title="Visualização em Lista"
            >
              <IconContainer size="sm" active={viewMode === 'list'}><List size={16} /></IconContainer>
            </button>
            <button 
              onClick={() => setViewMode('chart')}
              className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'chart' ? 'bg-indigo-50 shadow-sm text-indigo-600 ring-1 ring-indigo-400' : 'text-slate-400 bg-slate-200 hover:bg-slate-300 hover:text-slate-600'}`}
              title="Visualização em Gráficos"
            >
              <IconContainer size="sm" active={viewMode === 'chart'}><BarChart2 size={16} /></IconContainer>
            </button>
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button 
              onClick={() => handlePrint()}
              className="p-1.5 rounded-md transition-colors text-slate-500 hover:text-slate-700 hover:bg-white shadow-sm"
              title="Imprimir Relatório"
            >
              <IconContainer size="sm"><Printer size={16} /></IconContainer>
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button 
              onClick={handleExportPDF}
              className="p-1.5 rounded-md transition-colors text-slate-500 hover:text-slate-700 hover:bg-white shadow-sm"
              title="Exportar PDF"
            >
              <IconContainer size="sm"><FileText size={16} /></IconContainer>
            </button>
            <button 
              onClick={handleExportExcel}
              className="p-1.5 rounded-md transition-colors text-slate-500 hover:text-slate-700 hover:bg-white shadow-sm"
              title="Exportar Planilha"
            >
              <IconContainer size="sm"><Download size={16} /></IconContainer>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Data Inicial</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Data Final</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status do Pedido</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Todos</option>
              <option value="Orçamento">Orçamento</option>
              <option value="Aguardando Arte">Aguardando Arte</option>
              <option value="Em Produção">Em Produção</option>
              <option value="Pronto para Retirada">Pronto para Retirada</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Forma de Pagamento</label>
            <select 
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Todas</option>
              <option value="PIX">PIX</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Boleto">Boleto</option>
              <option value="Transferência">Transferência</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <IconContainer><DollarSign size={24} /></IconContainer>
            <div>
              <p className="text-sm text-slate-500 font-medium">Faturamento Total</p>
              <h3 className="text-2xl font-bold text-slate-800">R$ {totalRevenue.toFixed(2)}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <IconContainer><DollarSign size={24} /></IconContainer>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Descontos</p>
              <h3 className="text-2xl font-bold text-rose-600">R$ {totalDiscount.toFixed(2)}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <IconContainer><BarChart2 size={24} /></IconContainer>
            <div>
              <p className="text-sm text-slate-500 font-medium">Lucro Total</p>
              <h3 className="text-2xl font-bold text-emerald-700">R$ {totalProfit.toFixed(2)}</h3>
              <p className="text-xs text-emerald-600 font-medium">{profitMargin.toFixed(1)}% de margem</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <IconContainer><CreditCard size={24} /></IconContainer>
            <div>
              <p className="text-sm text-slate-500 font-medium">Valor Recebido</p>
              <h3 className="text-2xl font-bold text-slate-800">R$ {totalPaid.toFixed(2)}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <IconContainer><Calendar size={24} /></IconContainer>
            <div>
              <p className="text-sm text-slate-500 font-medium">Valor Pendente</p>
              <h3 className="text-2xl font-bold text-slate-800">R$ {totalPending.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px] mb-6">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-500" />
              Faturamento por Período
            </h3>
          </div>
          <div className="p-4 flex-1 overflow-auto">
            {viewMode === 'list' ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">Total</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">Lucro</th>
                    <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">% Lucro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order, i) => {
                    const total = calculateOrderTotal(order);
                    const profit = calculateOrderProfit(order);
                    const margin = total > 0 ? (profit / total) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm text-slate-700">{format(parseISO(order.createdAt), 'dd/MM/yy HH:mm')}</td>
                        <td className="px-6 py-3 text-sm text-slate-700">{order.customerName}</td>
                        <td className="px-6 py-3 text-sm font-medium text-slate-800 text-right">R$ {total.toFixed(2)}</td>
                        <td className="px-6 py-3 text-sm font-medium text-emerald-600 text-right">R$ {profit.toFixed(2)}</td>
                        <td className="px-6 py-3 text-sm font-medium text-emerald-600 text-right">{margin.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">Nenhum dado encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="h-full w-full min-h-[300px]">
                {revenueOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueOverTime}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => `R$ ${value}`}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                        labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">Nenhum dado encontrado</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Package size={18} className="text-indigo-500" />
                Vendas por Produto
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              {viewMode === 'list' ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Produto</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">Qtd</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">Receita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productsSold.map(([name, data], i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm text-slate-700">{name}</td>
                        <td className="px-6 py-3 text-sm text-slate-700 text-right">{data.quantity}</td>
                        <td className="px-6 py-3 text-sm font-medium text-slate-800 text-right">R$ {data.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                    {productsSold.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">Nenhum dado encontrado</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="h-full w-full min-h-[300px]">
                  {productsSold.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={productsSold.map(([name, data]) => ({ name, revenue: data.revenue, quantity: data.quantity }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          yAxisId="left"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickFormatter={(value) => `R$ ${value}`}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number, name: string) => {
                            if (name === 'revenue') return [`R$ ${value.toFixed(2)}`, 'Receita'];
                            if (name === 'quantity') return [value, 'Quantidade'];
                            return [value, name];
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar yAxisId="left" dataKey="revenue" name="Receita" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar yAxisId="right" dataKey="quantity" name="Quantidade" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">Nenhum dado encontrado</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-500" />
                Recebimentos por Forma de Pagamento
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              {viewMode === 'list' ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Método</th>
                      <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentMethods.map(([method, amount], i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm text-slate-700">{method}</td>
                        <td className="px-6 py-3 text-sm font-medium text-slate-800 text-right">R$ {amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {paymentMethods.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-slate-500 text-sm">Nenhum dado encontrado</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="h-full w-full min-h-[300px]">
                  {paymentMethods.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethods.map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {paymentMethods.map((entry, index) => {
                            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">Nenhum dado encontrado</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden printable content */}
        <div className="hidden">
          <div ref={printRef} className="p-8 font-sans text-slate-800 bg-white print:p-4">
            {companyInfo && (
              <div className="flex items-center justify-between mb-6 border-b border-indigo-100 pb-6">
                <div className="flex items-center gap-6">
                  {companyInfo.logoUrl && (
                    <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-indigo-50 rounded-2xl p-2 border border-indigo-100 shadow-sm">
                      <img 
                        src={companyInfo.logoUrl} 
                        alt="Logo" 
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold uppercase text-indigo-900">{companyInfo.name}</h2>
                    <p className="text-xs text-slate-600">CNPJ: {companyInfo.cnpj} | Tel: {companyInfo.phone}</p>
                    <p className="text-xs text-slate-600">{companyInfo.address}</p>
                    {companyInfo.branches && companyInfo.branches.length > 0 && (
                      <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Filiais:</p>
                        {companyInfo.branches.map(b => (
                          <p key={b.id} className="text-[10px] text-slate-600">{b.name}: {b.address}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <h1 className="text-xl font-bold uppercase text-center mb-6 tracking-widest text-indigo-900 bg-indigo-50 py-3 rounded-2xl">RELATÓRIO FINANCEIRO</h1>
            <p className="text-center text-slate-500 mb-6 text-xs">
              Período: {startDate ? format(parseISO(startDate), 'dd/MM/yyyy') : 'Início'} até {endDate ? format(parseISO(endDate), 'dd/MM/yyyy') : 'Hoje'}
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Faturamento Total</p>
                <p className="text-sm font-bold text-indigo-900">R$ {totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-[10px] text-emerald-600 uppercase font-bold">Valor Recebido</p>
                <p className="text-sm font-bold text-emerald-900">R$ {totalPaid.toFixed(2)}</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                <p className="text-[10px] text-rose-600 uppercase font-bold">Valor Pendente</p>
                <p className="text-sm font-bold text-rose-900">R$ {totalPending.toFixed(2)}</p>
              </div>
            </div>

            <h2 className="text-sm font-bold mb-3 text-indigo-900 uppercase tracking-wider">Vendas por Produto</h2>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-indigo-50 text-indigo-900">
                  <th className="border-b border-indigo-100 p-3 text-left text-[10px] uppercase tracking-wider rounded-tl-2xl">Produto</th>
                  <th className="border-b border-indigo-100 p-3 text-right text-[10px] uppercase tracking-wider">Qtd</th>
                  <th className="border-b border-indigo-100 p-3 text-right text-[10px] uppercase tracking-wider rounded-tr-2xl">Receita</th>
                </tr>
              </thead>
              <tbody>
                {productsSold.map(([name, data], i) => (
                  <tr key={i} className={`text-xs ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="border-b border-slate-100 p-3 text-slate-800 font-medium">{name}</td>
                    <td className="border-b border-slate-100 p-3 text-slate-600 text-right">{data.quantity}</td>
                    <td className="border-b border-slate-100 p-3 text-slate-600 text-right">R$ {data.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className="text-sm font-bold mb-3 text-indigo-900 uppercase tracking-wider">Recebimentos por Forma de Pagamento</h2>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-indigo-50 text-indigo-900">
                  <th className="border-b border-indigo-100 p-3 text-left text-[10px] uppercase tracking-wider rounded-tl-2xl">Método</th>
                  <th className="border-b border-indigo-100 p-3 text-right text-[10px] uppercase tracking-wider rounded-tr-2xl">Valor</th>
                </tr>
              </thead>
              <tbody>
                {paymentMethods.map(([method, amount], i) => (
                  <tr key={i} className={`text-xs ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="border-b border-slate-100 p-3 text-slate-800 font-medium">{method}</td>
                    <td className="border-b border-slate-100 p-3 text-slate-600 text-right">R$ {amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-12 text-center text-[10px] text-slate-400 border-t border-indigo-50 pt-4">
              <p className="font-bold text-slate-500 mb-1">JESUS É BOM, DEUS É FIEL</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
