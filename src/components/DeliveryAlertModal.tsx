import React from 'react';
import { AlertTriangle, Calendar, X } from 'lucide-react';
import { Order } from '../types';

interface DeliveryAlertModalProps {
  onClose: () => void;
  overdueOrders: Order[];
  upcomingOrders: Order[];
}

export function DeliveryAlertModal({ onClose, overdueOrders, upcomingOrders }: DeliveryAlertModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card-3d bg-white w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-amber-600">
            <AlertTriangle size={24} />
            <h2 className="text-lg font-bold text-slate-800">Atenção: Entregas</h2>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {overdueOrders.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider mb-2">Vencidas</h3>
                <div className="space-y-2">
                  {overdueOrders.map(order => (
                    <div key={order.id} className="bg-rose-50 p-3 rounded-lg border border-rose-100 flex justify-between items-center">
                      <span className="text-sm font-medium text-rose-900">Pedido #{order.queueNumber} - {order.customerName}</span>
                      <span className="text-xs font-bold text-rose-600">{order.estimatedDeliveryDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcomingOrders.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-2">Próximas (3 dias)</h3>
                <div className="space-y-2">
                  {upcomingOrders.map(order => (
                    <div key={order.id} className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex justify-between items-center">
                      <span className="text-sm font-medium text-amber-900">Pedido #{order.queueNumber} - {order.customerName}</span>
                      <span className="text-xs font-bold text-amber-600">{order.estimatedDeliveryDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50/50 p-4 flex justify-end border-t border-slate-200/60 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <X size={16} />
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
