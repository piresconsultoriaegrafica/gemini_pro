import React from 'react';
import { format } from 'date-fns';
import { Order, CompanyInfo, ProductItem, Employee } from '../types';
import { calculateOrderTotal, calculateItemTotal } from '../utils';

interface PrintTemplateProps {
  order: Order;
  companyInfo: CompanyInfo;
  type: 'receipt-partial' | 'receipt-total' | 'order' | 'quotation';
  employees?: Employee[];
}

export const PrintTemplate = React.forwardRef<HTMLDivElement, PrintTemplateProps>(
  ({ order, companyInfo, type, employees = [] }, ref) => {
    
    const calculateSubtotal = () => {
      return (order.items || []).reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    const calculateTotal = () => {
      return calculateOrderTotal(order);
    };

    const totalItemDiscounts = order.items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      if (item.discountType === 'percentage') {
        return sum + (subtotal * (item.discountValue / 100));
      }
      return sum + item.discountValue;
    }, 0);

    const generalDiscountValue = order.generalDiscountType === 'percentage' 
      ? calculateSubtotal() * (order.generalDiscountValue / 100)
      : order.generalDiscountValue;

    const totalDiscount = totalItemDiscounts + generalDiscountValue;

    const total = calculateTotal();
    const remaining = Math.max(0, total - order.amountPaid);
    const isReceipt = type.startsWith('receipt');

    const paperSize = companyInfo.printerPaperSize || 'standard';
    const employeeName = employees.find(e => e.id === order.employeeId)?.name || order.employeeId;

    if (paperSize === '80mm' || paperSize === '50mm') {
      const is50mm = paperSize === '50mm';
      const containerClass = is50mm ? 'w-[188px] text-[10px]' : 'w-[300px] text-[12px]';
      const titleClass = is50mm ? 'text-sm' : 'text-base';
      const subtitleClass = is50mm ? 'text-[10px]' : 'text-xs';
      
      return (
        <div ref={ref} className={`font-mono text-black bg-white mx-auto p-2 ${containerClass} leading-tight print:p-4`}>
          {/* Header */}
          <div className="text-center mb-3 border-b border-black pb-2 border-dashed">
            {companyInfo.logoUrl && (
              <div className="flex justify-center mb-2">
                <img 
                  src={companyInfo.logoUrl} 
                  alt="Logo" 
                  className={is50mm ? 'max-w-[100px] max-h-[100px] object-contain' : 'max-w-[150px] max-h-[150px] object-contain'}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <h1 className={`font-bold uppercase ${titleClass}`}>{companyInfo.name}</h1>
            <p className={subtitleClass}>{companyInfo.address}</p>
            <p className={subtitleClass}>CNPJ: {companyInfo.cnpj}</p>
            <p className={subtitleClass}>Tel: {companyInfo.phone}</p>
            {companyInfo.instagram && <p className={subtitleClass}>IG: {companyInfo.instagram}</p>}
            {companyInfo.website && <p className={subtitleClass}>{companyInfo.website}</p>}
            {companyInfo.branches && companyInfo.branches.length > 0 && (
              <div className="mt-1">
                <p className={`font-bold ${subtitleClass}`}>Filiais:</p>
                {companyInfo.branches.map(b => (
                  <p key={b.id} className={subtitleClass}>{b.name}: {b.address}</p>
                ))}
              </div>
            )}
          </div>

          <div className="text-center mb-3 border-b border-black pb-2 border-dashed">
            <h2 className={`font-bold uppercase ${titleClass}`}>
              {type === 'receipt-partial' ? 'RECIBO PARCIAL' : 
               type === 'receipt-total' ? 'RECIBO TOTAL' : 
               type === 'quotation' ? 'COTAÇÃO' : 'PEDIDO'}
            </h2>
            <p className="font-bold text-lg mt-1">FILA: {order.queueNumber}º</p>
          </div>

          {/* Info */}
          <div className="mb-3 border-b border-black pb-2 border-dashed">
            <p><strong>CLI:</strong> {order.customerName}</p>
            <p><strong>TEL:</strong> {order.customerPhone}</p>
            {employeeName && <p><strong>ATEND:</strong> {employeeName}</p>}
            <p><strong>DATA:</strong> {format(new Date(order.createdAt), 'dd/MM/yy HH:mm')}</p>
          </div>

          {!isReceipt && (
            <div className="mb-3 border-b border-black pb-2 border-dashed">
              <p className="font-bold mb-1 border-b border-black">QTD x DESCRIÇÃO</p>
              {order.items.map((item, index) => {
                const itemTotal = calculateItemTotal(item);
                return (
                  <div key={item.id} className="mb-2">
                    <div className="flex justify-between">
                      <span className="font-bold">{item.quantity}x {item.name}</span>
                    </div>
                    {item.observations && <div className="text-[9px] italic ml-4">- {item.observations}</div>}
                    <div className="flex justify-between ml-4">
                      <span>UN: R${item.unitPrice.toFixed(2)}</span>
                      <span className="font-bold">R${itemTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          <div className="mb-3 border-b border-black pb-2 border-dashed">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>R$ {calculateSubtotal().toFixed(2)}</span>
            </div>
            {order.generalDiscountValue > 0 && (
              <div className="flex justify-between">
                <span>DESCONTO:</span>
                <span>
                  {order.generalDiscountType === 'percentage' 
                    ? `${order.generalDiscountValue}%` 
                    : `R$ ${order.generalDiscountValue.toFixed(2)}`}
                </span>
              </div>
            )}
            <div className={`flex justify-between font-bold mt-1 pt-1 border-t border-black ${titleClass}`}>
              <span>TOTAL:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>PAGO:</span>
              <span>R$ {order.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold mt-1">
              <span>FALTA:</span>
              <span>R$ {remaining.toFixed(2)}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-black border-dashed">
              <p><strong>FORMA:</strong> {order.paymentMethod}</p>
              <p><strong>STATUS:</strong> {order.paymentStatus}</p>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-[9px] font-bold">JESUS É BOM, DEUS É FIEL</p>
            <p className="text-[9px]">Obrigado pela preferência!</p>
            <p className="text-[9px]">Volte sempre!</p>
            <div className="h-8"></div> {/* Spacing for tear */}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className="p-8 font-sans text-slate-800 bg-white max-w-[800px] mx-auto print:max-w-none print:w-full print:p-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-100 pb-6 mb-6">
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
              <h1 className="text-xl font-bold uppercase tracking-wider text-indigo-900">{companyInfo.name}</h1>
              <p className="text-xs mt-1 text-slate-600">{companyInfo.address}</p>
              <p className="text-xs text-slate-600">CNPJ: {companyInfo.cnpj} | Tel: {companyInfo.phone}</p>
              <p className="text-xs text-slate-600">{companyInfo.email}</p>
              {(companyInfo.instagram || companyInfo.website) && (
                <p className="text-xs mt-1 text-indigo-600">
                  {companyInfo.instagram && <span>IG: {companyInfo.instagram}</span>}
                  {companyInfo.instagram && companyInfo.website && <span> | </span>}
                  {companyInfo.website && <span>{companyInfo.website}</span>}
                </p>
              )}
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
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-2 text-indigo-900">
              {type === 'receipt-partial' ? 'Recibo Parcial' : 
               type === 'receipt-total' ? 'Recibo Total' : 
               type === 'quotation' ? 'Cotação' : 'Pedido'}
            </h2>
            <div className="inline-block bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-indigo-600">Nº Fila</p>
              <p className="text-2xl font-black text-indigo-900">{order.queueNumber}º</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="border border-indigo-100 bg-slate-50/50 p-4 mb-6 rounded-2xl grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-indigo-500">Cliente</p>
            <p className="font-bold text-sm text-slate-800">{order.customerName}</p>
            <p className="text-xs text-slate-600">{order.customerPhone}</p>
            {order.employeeId && (
              <p className="text-[10px] mt-2 text-slate-500">
                <span className="font-bold uppercase text-indigo-500">Atendente: </span> 
                {employeeName}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-indigo-500">Data do Pedido</p>
            <p className="font-bold text-sm text-slate-800">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>

        {/* Items Table */}
        {!isReceipt && (
          <table className="w-full mb-6 border-collapse">
            <thead>
              <tr className="border-b border-indigo-100 text-indigo-600">
                <th className="text-left py-2 text-[10px] uppercase tracking-wider">Item / Descrição</th>
                <th className="text-center py-2 text-[10px] uppercase tracking-wider">Qtd</th>
                <th className="text-right py-2 text-[10px] uppercase tracking-wider">V. Unit</th>
                <th className="text-right py-2 text-[10px] uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => {
                return (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <p className="font-bold text-xs text-slate-800">{item.name}</p>
                      {item.observations && <p className="text-[10px] italic text-slate-500 mt-0.5">{item.observations}</p>}
                    </td>
                    <td className="text-center py-3 text-xs text-slate-600">{item.quantity}</td>
                    <td className="text-right py-3 text-xs text-slate-600">R$ {item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-3 font-bold text-xs text-indigo-900">R$ {calculateItemTotal(item).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Financial Summary */}
        <div className="border border-indigo-100 p-6 rounded-2xl bg-indigo-50/30">
          <h3 className="font-bold uppercase mb-4 border-b border-indigo-100 pb-2 text-xs text-indigo-900">Resumo Financeiro</h3>
          
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {calculateSubtotal().toFixed(2)}</span>
            </div>
            
            {order.generalDiscountValue > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Desconto Geral:</span>
                <span>
                  {order.generalDiscountType === 'percentage' 
                    ? `${order.generalDiscountValue}%` 
                    : `R$ ${order.generalDiscountValue.toFixed(2)}`}
                </span>
              </div>
            )}
            
            <div className="flex justify-between font-bold text-sm border-t border-indigo-100 pt-2 mt-2 text-indigo-900">
              <span>TOTAL:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between mt-4 text-emerald-700 font-bold text-sm bg-emerald-50 p-2 rounded-lg border border-emerald-100">
              <span>Valor Recebido:</span>
              <span>R$ {order.amountPaid.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between font-bold border-t border-indigo-100 pt-2 mt-2 text-slate-800">
              <span>Falta Pagar:</span>
              <span className={remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                R$ {remaining.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase text-indigo-500 mb-1">Forma de Pagamento</p>
              <p className="font-bold uppercase text-xs text-slate-800">{order.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-indigo-500 mb-1">Status Pagamento</p>
              <p className="font-bold uppercase text-xs text-slate-800">{order.paymentStatus}</p>
            </div>
          </div>
        </div>

        {!isReceipt && (
          <div className="mt-6 border border-indigo-100 p-4 rounded-2xl bg-slate-50/50">
            <h3 className="font-bold uppercase mb-1 text-[10px] text-indigo-500">Status do Pedido</h3>
            <p className="font-bold text-sm uppercase text-slate-800">{order.status}</p>
          </div>
        )}

        {!isReceipt && totalDiscount > 0 && (
          <div className="mt-6 border border-emerald-100 bg-emerald-50 p-4 text-center rounded-2xl">
            <p className="text-[10px] font-bold uppercase text-emerald-700 mb-1">VOCÊ ECONOMIZOU NESTE PEDIDO:</p>
            <p className="font-black text-lg text-emerald-800">R$ {totalDiscount.toFixed(2)}</p>
          </div>
        )}

        {!isReceipt && (
          <div className="mt-6">
            <h3 className="font-bold uppercase mb-2 text-[10px] text-indigo-500">Observações Gerais</h3>
            <p className="text-xs text-slate-600 whitespace-pre-wrap border border-indigo-100 p-4 rounded-2xl bg-slate-50/50 min-h-[80px]">
              {order.generalObservations || 'Nenhuma observação.'}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-[10px] text-slate-400 border-t border-indigo-50 pt-4">
          <p className="font-bold text-slate-500 mb-1">JESUS É BOM, DEUS É FIEL</p>
          <p>Documento gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <p className="mt-1">Obrigado pela preferência!</p>
        </div>
      </div>
    );
  }
);

PrintTemplate.displayName = 'PrintTemplate';
