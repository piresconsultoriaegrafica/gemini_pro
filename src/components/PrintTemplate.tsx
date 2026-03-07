import React from 'react';
import { format } from 'date-fns';
import { Order, CompanyInfo, ProductItem, Employee } from '../types';
import { calculateOrderTotal, calculateItemTotal } from '../utils';

interface PrintTemplateProps {
  order: Order;
  companyInfo: CompanyInfo;
  type: 'receipt-partial' | 'receipt-total' | 'order' | 'quotation' | 'delivery';
  employees?: Employee[];
  detailLevel?: 'detailed' | 'simple';
}

export const PrintTemplate = React.forwardRef<HTMLDivElement, PrintTemplateProps>(
  ({ order, companyInfo, type, employees = [], detailLevel = 'detailed' }, ref) => {
    
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
               type === 'quotation' ? 'COTAÇÃO' : 
               type === 'delivery' ? 'FICHA DE ENTREGA' : 'PEDIDO'}
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

          {type === 'delivery' && order.deliveryInfo && detailLevel === 'detailed' && (
            <div className="mb-3 border-b border-black pb-2 border-dashed bg-slate-50 p-1">
              <p className="font-bold border-b border-black mb-1">DADOS DE ENTREGA</p>
              <p><strong>DE:</strong> {order.deliveryInfo.senderName || companyInfo.name}</p>
              <p><strong>PARA:</strong> {order.deliveryInfo.receiverName}</p>
              <p><strong>TEL:</strong> {order.deliveryInfo.phone}</p>
              <p><strong>END:</strong> {order.deliveryInfo.address}</p>
              {order.deliveryInfo.referencePoint && <p><strong>REF:</strong> {order.deliveryInfo.referencePoint}</p>}
              {order.deliveryInfo.observations && <p><strong>OBS:</strong> {order.deliveryInfo.observations}</p>}
              <div className="mt-2 pt-1 border-t border-black border-dotted">
                <p className="font-bold">PAGAMENTO NO LOCAL?</p>
                <p className="text-lg">{order.deliveryInfo.paymentAtLocation ? 'SIM - RECEBER VALOR' : 'NÃO - JÁ PAGO'}</p>
                {order.deliveryInfo.paymentAtLocation && (
                  <p className="text-xl font-black">VALOR: R$ {remaining.toFixed(2)}</p>
                )}
              </div>
            </div>
          )}

          {(type === 'order' || type === 'quotation' || type === 'delivery') && detailLevel === 'detailed' && (
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
                    {type !== 'delivery' && (
                      <div className="flex justify-between ml-4">
                        <span>UN: R${item.unitPrice.toFixed(2)}</span>
                        <span className="font-bold">R${itemTotal.toFixed(2)}</span>
                      </div>
                    )}
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
      <div ref={ref} className="p-4 font-sans text-slate-800 bg-white max-w-[800px] mx-auto print:max-w-none print:w-full print:p-2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-3 print:break-inside-avoid">
          <div className="flex items-center gap-3">
            {companyInfo.logoUrl && (
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-indigo-50 rounded-xl p-1 border border-indigo-100 shadow-sm">
                <img 
                  src={companyInfo.logoUrl} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wider text-indigo-900 leading-tight">{companyInfo.name}</h1>
              <p className="text-[7px] mt-0.5 text-slate-600 leading-tight">{companyInfo.address}</p>
              <p className="text-[7px] text-slate-600 leading-tight">CNPJ: {companyInfo.cnpj} | Tel: {companyInfo.phone}</p>
              <p className="text-[7px] text-slate-600 leading-tight">{companyInfo.email}</p>
              {(companyInfo.instagram || companyInfo.website) && (
                <p className="text-[7px] mt-0.5 text-indigo-600 leading-tight">
                  {companyInfo.instagram && <span>IG: {companyInfo.instagram}</span>}
                  {companyInfo.instagram && companyInfo.website && <span> | </span>}
                  {companyInfo.website && <span>{companyInfo.website}</span>}
                </p>
              )}
              {companyInfo.branches && companyInfo.branches.length > 0 && (
                <div className="mt-1 bg-slate-50 p-1 rounded-md border border-slate-100">
                  <p className="text-[7px] font-bold text-slate-500 uppercase">Filiais:</p>
                  {companyInfo.branches.map(b => (
                    <p key={b.id} className="text-[7px] text-slate-600 leading-tight">{b.name}: {b.address}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-1 text-indigo-900">
              {type === 'receipt-partial' ? 'Recibo Parcial' : 
               type === 'receipt-total' ? 'Recibo Total' : 
               type === 'quotation' ? 'Cotação' : 
               type === 'delivery' ? 'Ficha de Entrega' : 'Pedido'}
            </h2>
            <div className="inline-block bg-indigo-50 border border-indigo-100 rounded-xl px-2 py-1 shadow-sm">
              <p className="text-[7px] font-bold uppercase text-indigo-600">Nº Fila</p>
              <p className="text-lg font-black text-indigo-900 leading-none">{order.queueNumber}º</p>
            </div>
          </div>
        </div>

        {/* Delivery Info (A4) */}
        {type === 'delivery' && order.deliveryInfo && detailLevel === 'detailed' && (
          <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-3 print:break-inside-avoid">
            <div className="border border-orange-200 bg-orange-50/50 p-3 rounded-xl">
              <h3 className="text-[8px] font-bold text-orange-800 uppercase tracking-wider border-b border-orange-200 pb-1 mb-2 flex items-center gap-1">
                <span className="w-1 h-3 bg-orange-500 rounded-full"></span>
                Dados de Entrega
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-[7px] font-bold uppercase text-orange-600">Remetente</p>
                  <p className="font-bold text-[8px] text-slate-800">{order.deliveryInfo.senderName || companyInfo.name}</p>
                </div>
                <div>
                  <p className="text-[7px] font-bold uppercase text-orange-600">Destinatário</p>
                  <p className="font-bold text-[8px] text-slate-800">{order.deliveryInfo.receiverName}</p>
                  <p className="text-[7px] text-slate-600">{order.deliveryInfo.phone}</p>
                </div>
                <div>
                  <p className="text-[7px] font-bold uppercase text-orange-600">Endereço</p>
                  <p className="text-[8px] text-slate-800 font-medium">{order.deliveryInfo.address}</p>
                  {order.deliveryInfo.referencePoint && (
                    <p className="text-[7px] text-slate-500 mt-0.5 italic">Ref: {order.deliveryInfo.referencePoint}</p>
                  )}
                </div>
                {order.deliveryInfo.observations && (
                  <div>
                    <p className="text-[7px] font-bold uppercase text-orange-600">Observações</p>
                    <p className="text-[7px] text-slate-600">{order.deliveryInfo.observations}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-indigo-200 bg-indigo-50/50 p-3 rounded-xl flex flex-col justify-center text-center">
              <h3 className="text-[8px] font-bold text-indigo-800 uppercase tracking-wider border-b border-indigo-200 pb-1 mb-2">
                Cobrança na Entrega
              </h3>
              <div className="space-y-2">
                <div className={`p-2 rounded-xl border border-dashed ${order.deliveryInfo.paymentAtLocation ? 'border-orange-400 bg-orange-100' : 'border-emerald-400 bg-emerald-100'}`}>
                  <p className="text-[7px] font-bold uppercase text-slate-600 mb-0.5">Status de Pagamento:</p>
                  <p className={`text-sm font-black ${order.deliveryInfo.paymentAtLocation ? 'text-orange-700' : 'text-emerald-700'}`}>
                    {order.deliveryInfo.paymentAtLocation ? 'RECEBER NO LOCAL' : 'JÁ PAGO / NÃO COBRAR'}
                  </p>
                </div>
                
                {order.deliveryInfo.paymentAtLocation && (
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-indigo-100">
                    <p className="text-[7px] font-bold uppercase text-indigo-600 mb-0.5">VALOR A RECEBER:</p>
                    <p className="text-xl font-black text-indigo-900">R$ {remaining.toFixed(2)}</p>
                    <p className="text-[7px] text-slate-400 mt-1 uppercase">Confira os itens antes de entregar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="border border-indigo-100 bg-slate-50/50 p-2 mb-3 rounded-xl grid grid-cols-2 gap-2 print:break-inside-avoid">
          <div>
            <p className="text-[7px] font-bold uppercase text-indigo-500">Cliente</p>
            <p className="font-bold text-[8px] text-slate-800">{order.customerName}</p>
            <p className="text-[7px] text-slate-600">{order.customerPhone}</p>
            {order.employeeId && (
              <p className="text-[7px] mt-1 text-slate-500">
                <span className="font-bold uppercase text-indigo-500">Atendente: </span> 
                {employeeName}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[7px] font-bold uppercase text-indigo-500">Data do Pedido</p>
            <p className="font-bold text-[8px] text-slate-800">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>

        {/* Items Table */}
        {(type === 'order' || type === 'quotation' || type === 'delivery') && detailLevel === 'detailed' && (
          <div className="mb-3">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-indigo-100 text-indigo-600">
                  <th className="text-left py-1 text-[7px] uppercase tracking-wider">Item / Descrição</th>
                  <th className="text-center py-1 text-[7px] uppercase tracking-wider">Qtd</th>
                  {type !== 'delivery' && <th className="text-right py-1 text-[7px] uppercase tracking-wider">V. Unit</th>}
                  {type !== 'delivery' && <th className="text-right py-1 text-[7px] uppercase tracking-wider">Total</th>}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => {
                  return (
                    <tr key={item.id} className="border-b border-slate-100 print:break-inside-avoid">
                      <td className="py-1.5">
                        <p className="font-bold text-[8px] text-slate-800">{item.name}</p>
                        {item.observations && <p className="text-[7px] italic text-slate-500 mt-0.5">{item.observations}</p>}
                      </td>
                      <td className="text-center py-1.5 text-[8px] text-slate-600">{item.quantity}</td>
                      {type !== 'delivery' && <td className="text-right py-1.5 text-[8px] text-slate-600">R$ {item.unitPrice.toFixed(2)}</td>}
                      {type !== 'delivery' && <td className="text-right py-1.5 font-bold text-[8px] text-indigo-900">R$ {calculateItemTotal(item).toFixed(2)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Financial Summary */}
        {type !== 'delivery' && (
          <div className="border border-indigo-100 p-3 rounded-xl bg-indigo-50/30 print:break-inside-avoid">
            <h3 className="font-bold uppercase mb-2 border-b border-indigo-100 pb-1 text-[8px] text-indigo-900">Resumo Financeiro</h3>
            
            <div className="space-y-1 text-[7px] text-slate-600">
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
              
              <div className="flex justify-between font-bold text-[9px] border-t border-indigo-100 pt-1 mt-1 text-indigo-900">
                <span>TOTAL:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mt-2 text-emerald-700 font-bold text-[9px] bg-emerald-50 p-1 rounded-md border border-emerald-100">
                <span>Valor Recebido:</span>
                <span>R$ {order.amountPaid.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between font-bold border-t border-indigo-100 pt-1 mt-1 text-slate-800">
                <span>Falta Pagar:</span>
                <span className={remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  R$ {remaining.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-indigo-100 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[7px] font-bold uppercase text-indigo-500 mb-0.5">Forma de Pagamento</p>
                <p className="font-bold uppercase text-[8px] text-slate-800">{order.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] font-bold uppercase text-indigo-500 mb-0.5">Status Pagamento</p>
                <p className="font-bold uppercase text-[8px] text-slate-800">{order.paymentStatus}</p>
              </div>
            </div>
          </div>
        )}

        {type === 'delivery' && detailLevel === 'detailed' && (
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-center print:break-inside-avoid">
            <div className="inline-block border border-slate-800 p-2 rounded-lg">
              <p className="text-[8px] font-bold uppercase mb-0.5">Assinatura do Recebedor</p>
              <div className="w-32 h-6 border-b border-slate-400"></div>
              <p className="text-[7px] text-slate-400 mt-0.5">Data: ____/____/____ Hora: ____:____</p>
            </div>
          </div>
        )}

        {type !== 'delivery' && !isReceipt && detailLevel === 'detailed' && (
          <div className="mt-3 border border-indigo-100 p-2 rounded-xl bg-slate-50/50 print:break-inside-avoid">
            <h3 className="font-bold uppercase mb-0.5 text-[7px] text-indigo-500">Status do Pedido</h3>
            <p className="font-bold text-[8px] uppercase text-slate-800">{order.status}</p>
          </div>
        )}

        {!isReceipt && totalDiscount > 0 && detailLevel === 'detailed' && (
          <div className="mt-3 border border-emerald-100 bg-emerald-50 p-2 text-center rounded-xl print:break-inside-avoid">
            <p className="text-[7px] font-bold uppercase text-emerald-700 mb-0.5">VOCÊ ECONOMIZOU NESTE PEDIDO:</p>
            <p className="font-black text-sm text-emerald-800">R$ {totalDiscount.toFixed(2)}</p>
          </div>
        )}

        {!isReceipt && detailLevel === 'detailed' && (
          <div className="mt-3 print:break-inside-avoid">
            <h3 className="font-bold uppercase mb-1 text-[7px] text-indigo-500">Observações Gerais</h3>
            <p className="text-[8px] text-slate-600 whitespace-pre-wrap border border-indigo-100 p-2 rounded-xl bg-slate-50/50 min-h-[40px]">
              {order.generalObservations || 'Nenhuma observação.'}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-[7px] text-slate-400 border-t border-indigo-50 pt-2 print:break-inside-avoid">
          <p className="font-bold text-slate-500 mb-0.5">JESUS É BOM, DEUS É FIEL</p>
          <p>Documento gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <p className="mt-0.5">Obrigado pela preferência!</p>
        </div>
      </div>
    );
  }
);

PrintTemplate.displayName = 'PrintTemplate';
