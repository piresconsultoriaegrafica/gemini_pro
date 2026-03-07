import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export function DeletedOrders() {
  const { orders } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const deletedOrders = orders
    .filter(o => o.deleted && !o.isQuotation)
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
          <h2 className="text-2xl font-bold tracking-tight text-rose-600">Excluídos</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Histórico de pedidos excluídos permanentemente.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar pedido, cliente, telefone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-3d pl-10 pr-4 py-2.5 w-72 text-sm transition-all focus:ring-rose-200 focus:border-rose-400"
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
                <th className="px-6 py-4">Motivo da Exclusão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deletedOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-slate-500 group-hover:text-rose-600 transition-colors">
                    #{order.queueNumber}º
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200" title={order.archiveReason}>
                      {order.archiveReason || 'Não informado'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {deletedOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="font-medium">Nenhum pedido excluído encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
