import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../store';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, 
  isSameDay, addMonths, subMonths, isToday, differenceInDays, parseISO,
  startOfWeek, endOfWeek, isWithinInterval, setMonth, setYear, getYear
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertTriangle, Calendar as CalendarIcon, List, BarChart2, Clock, AlertCircle, CheckCircle, Printer, Download } from 'lucide-react';
import { OrderModal } from './OrderModal';
import { Order } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calculateOrderTotal } from '../utils';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export function CalendarView() {
  const { orders } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [thisWeekViewMode, setThisWeekViewMode] = useState<'list' | 'chart'>('list');
  const [overdueViewMode, setOverdueViewMode] = useState<'list' | 'chart'>('list');
  const calendarRef = useRef<HTMLDivElement>(null);

  const generateCalendarPDF = async () => {
    if (!calendarRef.current) return null;
    
    // Show loading state if needed
    const originalOverflow = calendarRef.current.style.overflow;
    const originalHeight = calendarRef.current.style.height;
    
    // Toggle headers for PDF generation
    const printHeader = document.getElementById('calendar-print-header');
    const screenHeader = document.getElementById('calendar-screen-header');
    
    if (printHeader) printHeader.classList.remove('hidden');
    if (screenHeader) screenHeader.classList.add('hidden');
    
    // Expand to capture full content
    calendarRef.current.style.overflow = 'visible';
    calendarRef.current.style.height = 'auto';
    
    const dataUrl = await toPng(calendarRef.current, {
      quality: 0.95,
      backgroundColor: '#ffffff',
      width: calendarRef.current.scrollWidth,
      height: calendarRef.current.scrollHeight,
      style: {
        overflow: 'visible',
        height: 'auto'
      }
    });
    
    // Restore styles and headers
    calendarRef.current.style.overflow = originalOverflow;
    calendarRef.current.style.height = originalHeight;
    
    if (printHeader) printHeader.classList.add('hidden');
    if (screenHeader) screenHeader.classList.remove('hidden');
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    if (pdfHeight > pdf.internal.pageSize.getHeight()) {
      const scale = pdf.internal.pageSize.getHeight() / pdfHeight;
      if (scale < 1) {
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth * scale, pdfHeight * scale);
      } else {
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
    } else {
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }
    
    return pdf;
  };

  const handlePrint = async () => {
    try {
      const pdf = await generateCalendarPDF();
      if (!pdf) return;
      
      pdf.autoPrint();
      const blob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(blob);
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (!newWindow) {
        alert('O bloqueador de pop-ups impediu a abertura da janela de impressão. Por favor, permita pop-ups para este site.');
        return;
      }
      
      newWindow.focus();
      // Wait for the PDF to load in the new window before triggering print
      newWindow.onload = () => {
        newWindow.print();
      };
      
      // Fallback: if onload doesn't trigger, try printing after a short delay
      setTimeout(() => {
        newWindow.print();
      }, 1000);
    } catch (error) {
      console.error('Error printing PDF:', error);
      alert('Erro ao preparar impressão. Tente usar a opção de baixar PDF.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const pdf = await generateCalendarPDF();
      if (!pdf) return;
      pdf.save(`calendario_entregas_${format(currentDate, 'MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente usar a opção de imprimir.');
      
      // Ensure headers are restored in case of error
      const printHeader = document.getElementById('calendar-print-header');
      const screenHeader = document.getElementById('calendar-screen-header');
      if (printHeader) printHeader.classList.add('hidden');
      if (screenHeader) screenHeader.classList.remove('hidden');
      
      // Restore styles in case of error
      if (calendarRef.current) {
        calendarRef.current.style.overflow = 'auto';
        calendarRef.current.style.height = '100%';
      }
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(setMonth(currentDate, parseInt(e.target.value)));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(setYear(currentDate, parseInt(e.target.value)));
  };

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => !o.archived && !o.deleted && !o.finalized && !o.isQuotation && o.estimatedDeliveryDate);
  }, [orders]);

  const getOrdersForDay = (day: Date) => {
    return activeOrders.filter(o => isSameDay(parseISO(o.estimatedDeliveryDate!), day));
  };

  const getAlertLevel = (day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = differenceInDays(day, today);
    
    if (diff < 0) return 'overdue';
    if (diff <= 3) return 'warning';
    return 'normal';
  };

  // --- Panels Data ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisWeekOrders = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(today, { weekStartsOn: 0 }); // Saturday
    return activeOrders
      .filter(o => isWithinInterval(parseISO(o.estimatedDeliveryDate!), { start, end }))
      .sort((a, b) => parseISO(a.estimatedDeliveryDate!).getTime() - parseISO(b.estimatedDeliveryDate!).getTime());
  }, [activeOrders, today]);

  const overdueOrders = useMemo(() => {
    return activeOrders
      .filter(o => {
        const deliveryDate = parseISO(o.estimatedDeliveryDate!);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate.getTime() < today.getTime();
      })
      .sort((a, b) => parseISO(a.estimatedDeliveryDate!).getTime() - parseISO(b.estimatedDeliveryDate!).getTime());
  }, [activeOrders, today]);

  // Chart Data
  const thisWeekChartData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = days.map(day => ({ name: day, pedidos: 0 }));
    thisWeekOrders.forEach(order => {
      const dayIndex = parseISO(order.estimatedDeliveryDate!).getDay();
      data[dayIndex].pedidos += 1;
    });
    return data;
  }, [thisWeekOrders]);

  const overdueChartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    overdueOrders.forEach(order => {
      const dateStr = format(parseISO(order.estimatedDeliveryDate!), 'dd/MM');
      dataMap.set(dateStr, (dataMap.get(dateStr) || 0) + 1);
    });
    return Array.from(dataMap.entries()).map(([name, pedidos]) => ({ name, pedidos }));
  }, [overdueOrders]);

  const currentYear = getYear(new Date());
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div ref={calendarRef} className="h-full flex flex-col bg-slate-50/50 overflow-auto print:block print:h-auto print:overflow-visible print:bg-white">
      <header id="calendar-screen-header" className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-10 gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" />
            Calendário de Entregas
          </h2>
          <p className="text-sm text-slate-500 mt-1">Acompanhe as datas de entrega dos pedidos ativos.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-3d btn-3d-secondary px-3 py-2 text-sm flex items-center gap-2"
              title="Imprimir Calendário"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="btn-3d btn-3d-secondary px-3 py-2 text-sm flex items-center gap-2"
              title="Exportar como PDF"
            >
              <Download size={16} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2 px-2">
            <select 
              value={currentDate.getMonth()} 
              onChange={handleMonthChange}
              className="bg-transparent font-semibold text-slate-800 text-sm focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
            >
              {months.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={currentDate.getFullYear()} 
              onChange={handleYearChange}
              className="bg-transparent font-semibold text-slate-800 text-sm focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        </div>
      </header>

      <div className="p-6 space-y-6 print:p-4 print:space-y-4">
        {/* Print Only Header */}
        <div id="calendar-print-header" className="hidden print:block text-center mb-3">
          <h1 className="text-sm font-bold text-slate-900 mb-0.5 uppercase tracking-widest">Calendário de Entregas</h1>
          <h2 className="text-[10px] text-slate-600 uppercase tracking-wide">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        {/* Calendar Grid */}
        <div className="card-3d overflow-hidden print:shadow-none print:border-slate-400 print:rounded-none">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 print:bg-slate-100 print:border-slate-400">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-semibold text-slate-600 uppercase tracking-wider print:text-slate-800 print:font-bold print:py-1 print:text-[8px]">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] print:auto-rows-[minmax(80px,auto)]">
            {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="border-b border-r border-slate-100 bg-slate-50/50 p-2 print:bg-white print:border-slate-300" />
            ))}
            
            {daysInMonth.map(day => {
              const dayOrders = getOrdersForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const alertLevel = getAlertLevel(day);
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`border-b border-r border-slate-100 p-2 transition-colors print:border-slate-300 print:p-1 ${!isCurrentMonth ? 'bg-slate-50/50 text-slate-400 print:bg-slate-50 print:text-slate-300' : 'bg-white'} ${isToday(day) ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/10 print:ring-0 print:bg-white' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2 print:mb-1">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-indigo-600 text-white print:bg-transparent print:text-slate-900 print:font-bold print:text-[10px] print:p-0 print:w-auto print:h-auto' : 'text-slate-700 print:text-slate-900 print:text-[10px]'}`}>
                      {format(day, 'd')}
                    </span>
                    {dayOrders.length > 0 && alertLevel === 'warning' && (
                      <span title="Entrega próxima" className="print:hidden">
                        <AlertTriangle size={16} className="text-amber-500" />
                      </span>
                    )}
                    {dayOrders.length > 0 && alertLevel === 'overdue' && (
                      <span title="Entrega atrasada" className="print:hidden">
                        <AlertTriangle size={16} className="text-red-500" />
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 print:space-y-0.5">
                    {dayOrders.map(order => (
                      <div 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)}
                        className={`text-xs p-1.5 rounded border cursor-pointer hover:shadow-sm transition-shadow print:border-slate-300 print:bg-white print:text-slate-800 print:text-[7px] print:p-0.5 ${alertLevel === 'overdue' ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : alertLevel === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'} truncate`}
                        title={`${order.customerName} - Pedido #${order.queueNumber}`}
                      >
                        <span className="font-bold">#{order.queueNumber}</span> {order.customerName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
          
          {/* This Week Panel */}
          <div className="card-3d overflow-hidden flex flex-col h-[400px]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-indigo-500" />
                Entregas desta Semana
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {thisWeekOrders.length}
                </span>
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setThisWeekViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${thisWeekViewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Visualização em Lista"
                >
                  <List size={16} />
                </button>
                <button 
                  onClick={() => setThisWeekViewMode('chart')}
                  className={`p-1.5 rounded-md transition-colors ${thisWeekViewMode === 'chart' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Visualização em Gráfico"
                >
                  <BarChart2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {thisWeekOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Clock size={48} className="mb-3 opacity-20" />
                  <p>Nenhuma entrega programada para esta semana.</p>
                </div>
              ) : thisWeekViewMode === 'list' ? (
                <div className="space-y-2">
                  {thisWeekOrders.map(order => (
                    <div 
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-medium text-slate-800 text-sm">#{order.queueNumber} - {order.customerName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{order.items.length} item(s) • Total: R$ {calculateOrderTotal(order).toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-indigo-600">
                          {format(parseISO(order.estimatedDeliveryDate!), 'EEEE', { locale: ptBR })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(parseISO(order.estimatedDeliveryDate!), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={thisWeekChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="pedidos" radius={[4, 4, 0, 0]}>
                        {thisWeekChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pedidos > 0 ? '#6366f1' : '#e2e8f0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Overdue Panel */}
          <div className="card-3d overflow-hidden flex flex-col h-[400px]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500" />
                Pedidos em Atraso
                {overdueOrders.length > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full ml-2 animate-pulse">
                    {overdueOrders.length}
                  </span>
                )}
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setOverdueViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${overdueViewMode === 'list' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Visualização em Lista"
                >
                  <List size={16} />
                </button>
                <button 
                  onClick={() => setOverdueViewMode('chart')}
                  className={`p-1.5 rounded-md transition-colors ${overdueViewMode === 'chart' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Visualização em Gráfico"
                >
                  <BarChart2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {overdueOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <CheckCircle size={48} className="mb-3 text-emerald-400 opacity-50" />
                  <p className="text-emerald-600 font-medium">Excelente! Nenhum pedido em atraso.</p>
                </div>
              ) : overdueViewMode === 'list' ? (
                <div className="space-y-2">
                  {overdueOrders.map(order => {
                    const daysLate = differenceInDays(today, parseISO(order.estimatedDeliveryDate!));
                    return (
                      <div 
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center justify-between p-3 rounded-lg border border-rose-100 bg-rose-50/30 hover:bg-rose-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-medium text-slate-800 text-sm">#{order.queueNumber} - {order.customerName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Venceu em {format(parseISO(order.estimatedDeliveryDate!), 'dd/MM/yyyy')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-rose-600">
                            {daysLate} {daysLate === 1 ? 'dia' : 'dias'}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">
                            Atrasado
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overdueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip 
                        cursor={{ fill: '#fff1f2' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #ffe4e6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="pedidos" radius={[4, 4, 0, 0]}>
                        {overdueChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#f43f5e" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {selectedOrder && (
        <OrderModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}
