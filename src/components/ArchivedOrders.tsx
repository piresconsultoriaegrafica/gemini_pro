import React, { useState } from 'react';
import { useAppContext } from '../store';
import { RefreshCw, Search, ArchiveRestore, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Order } from '../types';

export function ArchivedOrders() {
  const { orders, unarchiveOrder, deleteOrder } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [orderToUnarchive, setOrderToUnarchive] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const handleUnarchiveConfirm = () => {
    if (orderToUnarchive) {
      unarchiveOrder(orderToUnarchive.id);
      setOrderToUnarchive(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (orderToDelete) {
      deleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  const archivedOrders = orders
    .filter(o => o.archived && !o.deleted && !o.isQuotation)
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

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Cancelados</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Histórico de pedidos cancelados.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar pedido, cliente, telefone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-3d pl-10 pr-4 py-2.5 w-72 text-sm transition-all"
          />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="card-3d overflow-hidden bg-white shadow-sm border border-slate-200/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Nº Fila</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Data Criação</th>
                <th className="px-6 py-4">Motivo do Cancelamento</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {archivedOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                    #{order.queueNumber}º
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200" title={order.archiveReason}>
                      {order.archiveReason || 'Não informado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setOrderToUnarchive(order)}
                        className="btn-3d btn-3d-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                        title="Reabrir Pedido"
                      >
                        <ArchiveRestore size={14} />
                        Reabrir
                      </button>
                      <button 
                        onClick={() => setOrderToDelete(order)}
                        className="btn-3d btn-3d-danger px-3 py-1.5 text-xs flex items-center gap-1.5"
                        title="Mover para Excluídos"
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {archivedOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <ArchiveRestore className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="font-medium">Nenhum pedido cancelado encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {orderToUnarchive && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="card-3d bg-white max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-white/50">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 shadow-inner">
                <ArchiveRestore className="text-indigo-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Reabrir Pedido</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Deseja realmente reabrir o pedido de <strong className="text-slate-800">{orderToUnarchive.customerName}</strong>? Ele voltará para a fila de produção.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOrderToUnarchive(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnarchiveConfirm}
                className="btn-3d btn-3d-primary px-5 py-2 text-sm"
              >
                Sim, Reabrir
              </button>
            </div>
          </div>
        </div>
      )}

      {orderToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="card-3d bg-white max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-white/50">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 shadow-inner">
                <AlertCircle className="text-rose-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Excluir Pedido</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Deseja realmente excluir o pedido de <strong className="text-slate-800">{orderToDelete.customerName}</strong>? Ele será movido para a lixeira.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn-3d btn-3d-danger px-5 py-2 text-sm"
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
