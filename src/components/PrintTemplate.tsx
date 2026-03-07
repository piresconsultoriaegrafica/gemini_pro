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
        <div ref={ref} className={`font-mono text-black bg-white mx-auto p-2 ${containerClass} leading-tight`}>
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
            <p><strong>ENTREGA:</strong> {order.estimatedDeliveryDate ? format(new Date(order.estimatedDeliveryDate), 'dd/MM/yy') : 'A combinar'}</p>
          </div>

          {/* Items */}
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
          </div>

          {/* Observations */}
          {(order.generalObservations || totalDiscount > 0) && (
            <div className="mb-3 border-b border-black pb-2 border-dashed">
              {order.generalObservations && (
                <div className="mb-2">
                  <p className="font-bold">OBSERVAÇÕES:</p>
                  <p className="whitespace-pre-wrap">{order.generalObservations}</p>
                </div>
              )}
              {totalDiscount > 0 && (
                <div className="text-center font-bold border-2 border-black p-2 my-2 bg-slate-50">
                  <p className="text-[10px]">VOCÊ ECONOMIZOU NESTE PEDIDO:</p>
                  <p className="text-sm">R$ {totalDiscount.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-4">
            <p className="font-bold">STATUS: {order.status}</p>
            <p className="mt-2 text-[9px]">Obrigado pela preferência!</p>
            <p className="text-[9px]">Volte sempre!</p>
            <div className="h-8"></div> {/* Spacing for tear */}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className="p-8 font-sans text-black bg-white max-w-[800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-6 mb-6">
          <div className="flex items-center gap-6">
            {companyInfo.logoUrl && (
              <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center bg-white rounded-lg p-2 border border-gray-100">
                <img 
                  src={companyInfo.logoUrl} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider">{companyInfo.name}</h1>
              <p className="text-sm mt-1">{companyInfo.address}</p>
              <p className="text-sm">CNPJ: {companyInfo.cnpj} | Tel: {companyInfo.phone}</p>
              <p className="text-sm">{companyInfo.email}</p>
              {(companyInfo.instagram || companyInfo.website) && (
                <p className="text-sm mt-1">
                  {companyInfo.instagram && <span>IG: {companyInfo.instagram}</span>}
                  {companyInfo.instagram && companyInfo.website && <span> | </span>}
                  {companyInfo.website && <span>{companyInfo.website}</span>}
                </p>
              )}
              {companyInfo.branches && companyInfo.branches.length > 0 && (
                <div className="mt-1">
                  <p className="text-sm font-bold">Filiais:</p>
                  {companyInfo.branches.map(b => (
                    <p key={b.id} className="text-sm">{b.name}: {b.address}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black uppercase tracking-widest mb-2">
              {type === 'receipt-partial' ? 'Recibo Parcial' : 
               type === 'receipt-total' ? 'Recibo Total' : 
               type === 'quotation' ? 'Cotação' : 'Pedido'}
            </h2>
            <div className="inline-block border-4 border-black px-4 py-2">
              <p className="text-xs font-bold uppercase">Nº Fila</p>
              <p className="text-4xl font-black">{order.queueNumber}º</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="border border-black p-4 mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-gray-600">Cliente</p>
            <p className="font-bold text-lg">{order.customerName}</p>
            <p className="text-sm">{order.customerPhone}</p>
            {order.employeeId && (
              <p className="text-xs mt-2">
                <span className="font-bold uppercase text-gray-600">Atendente: </span> 
                {employeeName}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-gray-600">Data do Pedido</p>
            <p className="font-bold">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
            <p className="text-xs font-bold uppercase text-gray-600 mt-2">Previsão de Entrega</p>
            <p className="font-bold">{order.estimatedDeliveryDate ? format(new Date(order.estimatedDeliveryDate), 'dd/MM/yyyy') : 'A combinar'}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 text-sm uppercase">Item / Descrição</th>
              <th className="text-center py-2 text-sm uppercase">Qtd</th>
              <th className="text-right py-2 text-sm uppercase">V. Unit</th>
              {isReceipt && <th className="text-right py-2 text-sm uppercase">Desc.</th>}
              <th className="text-right py-2 text-sm uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
              const itemSubtotal = item.quantity * item.unitPrice;
              const itemDiscount = item.discountType === 'percentage' 
                ? itemSubtotal * (item.discountValue / 100) 
                : item.discountValue;

              return (
                <React.Fragment key={item.id}>
                  <tr className="border-b border-gray-300">
                    <td className="py-3">
                      <p className="font-bold">{item.name}</p>
                      {item.observations && <p className="text-xs italic text-gray-600 mt-1">{item.observations}</p>}
                    </td>
                    <td className="text-center py-3">{item.quantity}</td>
                    <td className="text-right py-3">R$ {item.unitPrice.toFixed(2)}</td>
                    {isReceipt && (
                      <td className="text-right py-3 text-red-600">
                        {itemDiscount > 0 ? `- R$ ${itemDiscount.toFixed(2)}` : '-'}
                      </td>
                    )}
                    <td className="text-right py-3 font-bold">R$ {calculateItemTotal(item).toFixed(2)}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Totals & Payment */}
        <div className="flex justify-between items-start border-t-2 border-black pt-6">
          <div className="w-1/2 pr-8">
            <h3 className="font-bold uppercase mb-2">Observações Gerais</h3>
            <p className="text-sm whitespace-pre-wrap border border-gray-300 p-3 min-h-[100px]">
              {order.generalObservations || 'Nenhuma observação.'}
            </p>
            
            <div className="mt-6 border border-black p-4">
              <h3 className="font-bold uppercase mb-2 text-sm">Status do Pedido</h3>
              <p className="font-black text-lg uppercase">{order.status}</p>
            </div>

            {totalDiscount > 0 && (
              <div className="mt-6 border-2 border-green-600 bg-green-50 p-4 text-center">
                <p className="text-sm font-bold uppercase text-green-800 mb-1">VOCÊ ECONOMIZOU NESTE PEDIDO:</p>
                <p className="font-black text-2xl text-green-700">R$ {totalDiscount.toFixed(2)}</p>
              </div>
            )}
          </div>
          
          <div className="w-1/2 border border-black p-4 bg-gray-50">
            <h3 className="font-bold uppercase mb-4 border-b border-gray-300 pb-2">Resumo Financeiro</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {calculateSubtotal().toFixed(2)}</span>
              </div>
              
              {order.generalDiscountValue > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto Geral:</span>
                  <span>
                    {order.generalDiscountType === 'percentage' 
                      ? `${order.generalDiscountValue}%` 
                      : `R$ ${order.generalDiscountValue.toFixed(2)}`}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between font-black text-xl border-t border-gray-300 pt-2 mt-2">
                <span>TOTAL:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mt-4 text-gray-600 font-bold text-lg bg-green-100 p-2 border border-green-300">
                <span>Valor Recebido:</span>
                <span>R$ {order.amountPaid.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between font-bold border-t border-gray-300 pt-2 mt-2">
                <span>Falta Pagar:</span>
                <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                  R$ {remaining.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-300">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Forma de Pagamento</p>
              <p className="font-bold uppercase text-lg">{order.paymentMethod}</p>
              <p className="text-xs font-bold uppercase text-gray-500 mt-2 mb-1">Status Pagamento</p>
              <p className="font-bold uppercase text-lg">{order.paymentStatus}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
          <p>Documento gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <p className="mt-1">Obrigado pela preferência!</p>
        </div>
      </div>
    );
  }
);

PrintTemplate.displayName = 'PrintTemplate';
