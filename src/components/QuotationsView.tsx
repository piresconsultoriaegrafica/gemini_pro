import React, { useState } from 'react';
import { useAppContext } from '../store';
import { IconContainer } from './IconContainer';
import { Search, FileText, Trash2, Edit2, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { OrderModal } from './OrderModal';
import { Order } from '../types';
import { calculateOrderTotal } from '../utils';

export function QuotationsView() {
  const { orders, deleteOrder } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const quotations = orders
    .filter(o => o.isQuotation && !o.deleted && !o.archived && !o.finalized)
    .filter(o => {
      const searchLower = searchTerm.toLowerCase().trim();
      if (!searchLower) return true;
      
      const customerMatch = o.customerName?.toLowerCase().includes(searchLower);
      const queueMatch = o.queueNumber?.toString().includes(searchLower);
      const idMatch = o.id?.toLowerCase().includes(searchLower);
      const phoneMatch = o.customerPhone?.replace(/\D/g, '').includes(searchLower.replace(/\D/g, ''));
      const itemMatch = o.items?.some(item => item.name.toLowerCase().includes(searchLower));
      
      return customerMatch || queueMatch || idMatch || phoneMatch || itemMatch;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDeleteConfirm = () => {
    if (orderToDelete) {
      deleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-all duration-300">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm">Cotações</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Gerencie suas cotações salvas.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar cotação..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-3d pl-10 pr-4 py-2 w-64 bg-slate-50 focus:bg-white transition-all duration-300"
          />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="card-3d overflow-hidden rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/40 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-200/60 text-slate-600 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Nº Fila</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Data Criação</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.map(order => {
                const total = calculateOrderTotal(order);

                return (
                  <tr key={order.id} className="hover:bg-indigo-50/30 transition-colors group odd:bg-white even:bg-slate-50/30">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit border border-slate-200/50 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                        #{order.queueNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit border border-emerald-100 shadow-sm">
                        <DollarSign size={14} />
                        R$ {total.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsModalOpen(true);
                          }}
                          className="btn-3d btn-3d-secondary px-3 py-1.5 text-xs flex items-center gap-2"
                          title="Editar Cotação"
                        >
                          <div className="p-1 rounded-lg bg-white shadow-sm border border-slate-100 text-indigo-500"><Edit2 size={14} /></div>
                          Abrir
                        </button>
                        <button 
                          onClick={() => setOrderToDelete(order)}
                          className="btn-3d btn-3d-danger px-3 py-1.5 text-xs flex items-center gap-2"
                          title="Excluir Cotação"
                        >
                          <div className="p-1 rounded-lg bg-white shadow-sm border border-slate-100 text-rose-500"><Trash2 size={14} /></div>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {quotations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                        <FileText size={24} />
                      </div>
                      <p>Nenhuma cotação encontrada.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <OrderModal 
          order={selectedOrder} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }} 
        />
      )}

      {orderToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border border-white/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 shadow-inner">
                <AlertCircle className="text-rose-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Excluir Cotação</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Tem certeza que deseja excluir a cotação de <strong className="text-slate-800">{orderToDelete.customerName}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn-3d btn-3d-danger px-4 py-2 text-sm"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
