import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import { Order } from '../types';
import { IconContainer } from './IconContainer';
import { Plus, List, LayoutGrid, Search, Filter, UserPlus, Edit2, Calendar, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrderModal } from './OrderModal';
import { CustomerModal } from './CustomerModal';
import { ProductModal } from './ProductModal';
import { COLOR_OPTIONS } from './SettingsModal';

import { calculateOrderTotal } from '../utils';

import { DashboardCharts } from './DashboardCharts';

export function Dashboard() {
  const { orders, productionStatuses, paymentStatuses, updateOrder, finalizeOrder } = useAppContext();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showCharts, setShowCharts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        setIsNewOrderModalOpen(true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsProductModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeOrders = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return orders
      .filter(o => !o.archived && !o.deleted && !o.finalized && !o.isQuotation)
      .filter(o => {
        if (!searchLower) return true;
        
        const customerMatch = o.customerName?.toLowerCase().includes(searchLower);
        const queueMatch = o.queueNumber?.toString().includes(searchLower);
        const idMatch = o.id?.toLowerCase().includes(searchLower);
        const phoneMatch = o.customerPhone?.replace(/\D/g, '').includes(searchLower.replace(/\D/g, ''));
        const itemMatch = o.items?.some(item => item.name.toLowerCase().includes(searchLower));
        
        return customerMatch || queueMatch || idMatch || phoneMatch || itemMatch;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders, searchTerm]);

  const pendingOrders = useMemo(() => {
    const lastStatus = productionStatuses[productionStatuses.length - 1]?.label;
    return orders
      .filter(o => !o.archived && !o.deleted && !o.finalized && o.status !== lastStatus && o.status !== 'cancelado')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders, productionStatuses]);

  const getQueuePosition = (orderId: string) => {
    const index = pendingOrders.findIndex(o => o.id === orderId);
    return index !== -1 ? index + 1 : null;
  };

  const getStatusColor = (statusLabel: string) => {
    const status = productionStatuses.find(s => s.label.toLowerCase() === statusLabel.toLowerCase());
    if (status) {
      const colorOpt = COLOR_OPTIONS.find(c => c.value === status.color);
      if (colorOpt) return colorOpt.classes;
    }
    return 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-500/20';
  };

  const getPaymentColor = (statusLabel: string) => {
    const status = paymentStatuses.find(s => s.label.toLowerCase() === statusLabel.toLowerCase());
    if (status) {
      const colorOpt = COLOR_OPTIONS.find(c => c.value === status.color);
      if (colorOpt) return colorOpt.classes;
    }
    return 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-500/20';
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      const lastStatus = productionStatuses[productionStatuses.length - 1]?.label;
      if (newStatus.toLowerCase() === lastStatus?.toLowerCase()) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          finalizeOrder(orderId, calculateOrderTotal(order));
        }
      } else {
        updateOrder(orderId, { status: newStatus });
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-all duration-300">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm">Painel de Atendimento</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Gerencie a fila de serviços e status de produção.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar pedido, cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-3d pl-10 pr-4 py-2 w-64 bg-slate-50 focus:bg-white transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/60 shadow-inner gap-1">
            <button 
              onClick={() => setShowCharts(!showCharts)}
              className={`p-2 rounded-lg transition-all duration-200 ${showCharts ? 'bg-white shadow-sm text-indigo-600 scale-100 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              title="Visualização de Gráficos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            </button>
            <div className="w-px h-4 bg-slate-300/50 mx-1"></div>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'kanban' ? 'bg-white shadow-sm text-indigo-600 scale-100 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              title="Visualização Kanban"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600 scale-100 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              title="Visualização em Lista"
            >
              <List size={18} />
            </button>
          </div>

          <button 
            onClick={() => setIsProductModalOpen(true)}
            className="btn-3d btn-3d-secondary px-4 py-2 text-sm flex items-center gap-2"
          >
            <div className="p-1 rounded-lg bg-white shadow-sm border border-slate-100 text-indigo-500"><Plus size={16} /></div>
            <span className="hidden lg:inline">Produto</span>
            <kbd className="hidden xl:inline-flex items-center justify-center px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-500 ml-1 shadow-sm">F3</kbd>
          </button>

          <button 
            onClick={() => setIsCustomerModalOpen(true)}
            className="btn-3d btn-3d-secondary px-4 py-2 text-sm flex items-center gap-2"
          >
            <div className="p-1 rounded-lg bg-white shadow-sm border border-slate-100 text-indigo-500"><UserPlus size={16} /></div>
            <span className="hidden lg:inline">Cliente</span>
            <kbd className="hidden xl:inline-flex items-center justify-center px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-500 ml-1 shadow-sm">F2</kbd>
          </button>

          <button 
            onClick={() => setIsNewOrderModalOpen(true)}
            className="btn-3d btn-3d-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            <div className="p-1 rounded-lg bg-white shadow-sm border border-slate-100 text-indigo-500"><Plus size={16} /></div>
            <span className="hidden lg:inline">Novo Pedido</span>
            <kbd className="hidden xl:inline-flex items-center justify-center px-1.5 py-0.5 bg-indigo-500 border border-indigo-400 rounded text-[10px] font-mono text-white ml-1 shadow-sm">F1</kbd>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {showCharts && <DashboardCharts />}
        
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-4">
            {productionStatuses.map(statusObj => {
              const status = statusObj.label;
              const columnOrders = activeOrders.filter(o => o.status.toLowerCase() === status.toLowerCase());
              
              return (
                <div 
                  key={statusObj.id} 
                  className="flex flex-col min-h-[150px] bg-slate-100/50 rounded-2xl border border-slate-200/60 transition-all duration-300 hover:bg-slate-100/80 backdrop-blur-sm shadow-sm"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className={`px-4 py-3 border-b border-slate-200/50 rounded-t-2xl flex items-center justify-between ${getStatusColor(status).replace('border-', 'border-b-')}`}>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(status).includes('bg-') ? getStatusColor(status).split(' ')[0].replace('bg-', 'bg-') : 'bg-slate-400'}`}></span>
                      {status}
                    </h3>
                    <span className="bg-white/80 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm border border-slate-100">
                      {columnOrders.length}
                    </span>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {columnOrders.map(order => {
                      const queuePos = getQueuePosition(order.id);
                      return (
                        <div 
                          key={order.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, order.id)}
                          className="card-3d p-4 group relative cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform duration-300 bg-white border border-slate-200/60 shadow-sm hover:shadow-md"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 w-fit shadow-sm">
                                #{order.queueNumber}
                              </span>
                              {queuePos && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 w-fit shadow-sm flex items-center gap-1">
                                  <Clock size={10} />
                                  {queuePos}º na Fila
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ring-1 ring-inset shadow-sm ${getPaymentColor(order.paymentStatus)}`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                          
                          <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1 mt-2 group-hover:text-indigo-700 transition-colors">
                            {order.customerName}
                          </h4>
                          
                          <div className="text-xs text-slate-500 space-y-2 mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="font-medium flex items-center gap-1">
                                <List size={12} /> Itens:
                              </span>
                              <span className="font-bold text-slate-700 bg-slate-100 px-1.5 rounded">{order.items.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium flex items-center gap-1">
                                <Calendar size={12} /> Entrega:
                              </span>
                              <span className="font-bold text-slate-700">
                                {order.estimatedDeliveryDate ? format(new Date(order.estimatedDeliveryDate), 'dd/MM/yyyy') : 'Não definida'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="font-medium flex items-center gap-1">
                                <DollarSign size={12} /> Total:
                              </span>
                              <span className="font-bold text-slate-800">
                                R$ {calculateOrderTotal(order).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {columnOrders.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200/60 rounded-xl mx-2 bg-slate-50/30">
                        <span className="block opacity-50 font-medium">Nenhum pedido</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-3d overflow-hidden rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/40 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-200/60 text-slate-600 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Fila / Pedido</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Status Produção</th>
                  <th className="px-6 py-4">Status Pagamento</th>
                  <th className="px-6 py-4">Data Entrega</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeOrders.map(order => {
                  const queuePos = getQueuePosition(order.id);
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-indigo-50/30 transition-colors group odd:bg-white even:bg-slate-50/30 cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit border border-slate-200/50 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                            #{order.queueNumber}
                          </span>
                          {queuePos && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 w-fit shadow-sm flex items-center gap-1">
                              <Clock size={10} />
                              {queuePos}º na Fila
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border shadow-sm ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ring-1 ring-inset shadow-sm ${getPaymentColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {order.estimatedDeliveryDate ? format(new Date(order.estimatedDeliveryDate), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="btn-3d btn-3d-secondary px-3 py-1.5 text-xs flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0"
                        >
                          <Edit2 size={14} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {activeOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/50">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                          <Search size={24} />
                        </div>
                        <p>Nenhum pedido encontrado.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {(selectedOrder || isNewOrderModalOpen) && (
        <OrderModal 
          order={selectedOrder} 
          onClose={() => {
            setSelectedOrder(null);
            setIsNewOrderModalOpen(false);
          }} 
        />
      )}

      {isCustomerModalOpen && (
        <CustomerModal onClose={() => setIsCustomerModalOpen(false)} />
      )}

      {isProductModalOpen && (
        <ProductModal onClose={() => setIsProductModalOpen(false)} />
      )}
    </div>
  );
}
