import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Search, CheckCircle, Eye, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { OrderModal } from './OrderModal';
import { Order } from '../types';

export function FinalizedOrders() {
  const { orders } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const finalizedOrders = orders
    .filter(o => o.finalized && !o.deleted && !o.archived && !o.isQuotation)
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

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-emerald-600 flex items-center gap-2">
            <CheckCircle size={24} className="text-emerald-500" />
            Finalizados
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Histórico de pedidos concluídos e entregues.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar pedido, cliente, telefone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2.5 w-72 text-sm transition-all focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Nº Fila</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Data Criação</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Valor Pago</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {finalizedOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-slate-500 group-hover:text-emerald-600 transition-colors">
                    #{order.queueNumber}º
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    R$ {order.amountPaid.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleViewOrder(order)}
                      className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 px-3 py-1.5 text-xs flex items-center gap-1.5 ml-auto rounded-lg transition-colors"
                      title="Visualizar Pedido"
                    >
                      <Eye size={16} />
                      Visualizar
                    </button>
                  </td>
                </tr>
              ))}
              
              {finalizedOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="font-medium">Nenhum pedido finalizado encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedOrder && (
        <OrderModal 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }} 
          order={selectedOrder}
          isReadOnly={true}
        />
      )}
    </div>
  );
}
