import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../store';
import { Order, ProductItem, DiscountType } from '../types';
import { 
  X, Plus, Trash2, Printer, Save, Archive, AlertCircle, Search, 
  UserPlus, CheckCircle, Download, FileText, Minus, Square, Maximize2, Package
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PrintTemplate } from './PrintTemplate';
import { CustomerModal } from './CustomerModal';
import { ProductModal } from './ProductModal';
import { calculateOrderTotal } from '../utils';
import { format } from 'date-fns';

interface OrderModalProps {
  order: Order | null;
  onClose: () => void;
  isReadOnly?: boolean;
}

export function OrderModal({ order, onClose, isReadOnly = false }: OrderModalProps) {
  const { 
    addOrder, updateOrder, deleteOrder, archiveOrder, finalizeOrder,
    companyInfo, customers, products, employees,
    productionStatuses, paymentStatuses, paymentMethods
  } = useAppContext();
  
  const [formData, setFormData] = useState<Partial<Order>>({
    customerName: '',
    customerPhone: '',
    employeeId: '',
    estimatedDeliveryDate: '',
    status: productionStatuses[0]?.label || 'fila',
    paymentStatus: paymentStatuses[0]?.label || 'pendente',
    paymentMethod: paymentMethods[0]?.label || 'pix',
    items: [],
    generalDiscountType: 'value',
    generalDiscountValue: 0,
    amountPaid: 0,
    generalObservations: '',
    deliveryInfo: {
      isDelivery: false,
      senderName: '',
      receiverName: '',
      phone: '',
      address: '',
      referencePoint: '',
      observations: '',
      paymentAtLocation: false,
    }
  });

  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [printType, setPrintType] = useState<'receipt-partial' | 'receipt-total' | 'order' | 'quotation' | 'delivery' | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (order) {
      setFormData(order);
    } else {
      // Get current user from session storage to auto-fill employee
      const savedUser = sessionStorage.getItem('empresa-current-user');
      const currentUser = savedUser ? JSON.parse(savedUser) : null;

      // Add one empty item by default for new orders
      setFormData(prev => ({
        ...prev,
        employeeId: currentUser?.id || '',
        items: [{
          id: uuidv4(),
          name: '',
          quantity: 1,
          unitPrice: 0,
          costPrice: 0,
          discountType: 'value',
          discountValue: 0,
          observations: ''
        }]
      }));
    }
  }, [order]);

  const triggerPrint = (type: 'receipt-partial' | 'receipt-total' | 'order' | 'quotation' | 'delivery') => {
    setPrintType(type);
    setTimeout(() => {
      if (!printRef.current) return;
      
      const isDirectPrint = companyInfo?.directPrint;
      const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
      const prefix = type === 'quotation' ? 'cotacao' : type.startsWith('receipt') ? 'recibo' : type === 'delivery' ? 'entrega' : 'pedido';
      const title = `${prefix}_${order?.queueNumber || 'novo'}_${dateStr}`;
      
      const html = `
        <html>
          <head>
            <title>${title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            ${isDirectPrint ? `
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 0; }
              }
            </style>
            ` : ''}
          </head>
          <body>
            ${printRef.current.innerHTML}
            ${!isDirectPrint ? `
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
            ` : ''}
          </body>
        </html>
      `;

      if (isDirectPrint) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        iframe.contentDocument?.write(html);
        iframe.contentDocument?.close();
        
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      } else {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        }
      }
      
      // Reset print type after a delay
      setTimeout(() => setPrintType(null), 1000);
    }, 100);
  };

  const calculateItemTotal = (item: ProductItem) => {
    const subtotal = item.quantity * item.unitPrice;
    if (item.discountType === 'percentage') {
      return subtotal * (1 - item.discountValue / 100);
    }
    return Math.max(0, subtotal - item.discountValue);
  };

  const calculateSubtotal = () => {
    return (formData.items || []).reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateTotal = () => {
    return calculateOrderTotal(formData);
  };

  const handleSave = (isQuotation: boolean = false) => {
    if (!formData.customerName) {
      alert('Nome do cliente é obrigatório');
      return;
    }

    const orderData = { ...formData, isQuotation };

    if (order) {
      updateOrder(order.id, orderData);
    } else {
      addOrder(orderData as Omit<Order, 'id' | 'queueNumber' | 'createdAt' | 'archived'>);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!deleteReason.trim()) {
      alert('Por favor, informe o motivo do cancelamento/arquivamento.');
      return;
    }
    if (order) {
      archiveOrder(order.id, deleteReason);
      onClose();
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), {
        id: uuidv4(),
        name: '',
        quantity: 1,
        unitPrice: 0,
        costPrice: 0,
        discountType: 'value',
        discountValue: 0,
        observations: ''
      }]
    }));
  };

  const updateItem = (id: string, field: keyof ProductItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter(item => item.id !== id)
    }));
  };

  const filteredCustomers = (customers || []).filter(c => 
    c.name.toLowerCase().includes((formData.customerName || '').toLowerCase()) ||
    c.phone.includes(formData.customerName || '')
  );

  const getFilteredProducts = (search: string) => {
    return (products || []).filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase())) ||
      p.variations?.some(v => v.barcode && v.barcode.toLowerCase().includes(search.toLowerCase()))
    );
  };

  const handleSelectProduct = (itemId: string, product: any, variation?: any) => {
    const name = variation ? `${product.name} - ${variation.name}` : product.name;
    const price = variation ? variation.price : product.basePrice;
    const costPrice = variation ? (variation.costPrice || 0) : (product.costPrice || 0);
    
    updateItem(itemId, 'name', name);
    updateItem(itemId, 'unitPrice', price);
    updateItem(itemId, 'costPrice', costPrice);
    setActiveItemIndex(null);
    setShowProductDropdown(false);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 w-72 z-50">
        <div className="bg-white rounded-t-xl shadow-2xl border border-slate-200 border-b-0 overflow-hidden">
          <div 
            className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors" 
            onClick={() => setIsMinimized(false)}
          >
            <div className="font-bold text-slate-700 text-sm truncate flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              {order ? (order.isQuotation ? `Cotação #${order.queueNumber}` : `Pedido #${order.queueNumber}`) : 'Novo Pedido'}
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); setIsMinimized(false); }} 
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              >
                <Square size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300 ${isMaximized ? 'p-0' : 'p-4'}`}>
      <div className={`card-3d bg-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between bg-slate-50/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {order ? (order.isQuotation ? `Cotação #${order.queueNumber}` : `Pedido #${order.queueNumber}`) : 'Novo Pedido'}
                {order && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    order.isQuotation ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {order.isQuotation ? 'Rascunho' : 'Ativo'}
                  </span>
                )}
              </h2>
              {order && <p className="text-xs text-slate-500 mt-1 font-medium">Criado em: {new Date(order.createdAt).toLocaleString('pt-BR')}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order && (
              <div className="flex gap-2 mr-4 border-r border-slate-200/60 pr-4">
                {order.isQuotation ? (
                  <button 
                    onClick={() => triggerPrint('quotation')}
                    className="btn-3d btn-3d-secondary p-2 text-slate-600 flex items-center gap-2 text-sm"
                    title="Imprimir Cotação"
                  >
                    <Printer size={18} />
                    <span className="hidden sm:inline">Cotação</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => triggerPrint('order')}
                      className="btn-3d btn-3d-secondary p-2 text-slate-600 flex items-center gap-2 text-sm"
                      title="Imprimir Pedido Completo"
                    >
                      <Printer size={18} />
                      <span className="hidden sm:inline">Pedido</span>
                    </button>
                    {formData.deliveryInfo?.isDelivery && (
                      <button 
                        onClick={() => triggerPrint('delivery')}
                        className="btn-3d btn-3d-secondary p-2 text-orange-600 flex items-center gap-2 text-sm"
                        title="Imprimir Ficha de Entrega"
                      >
                        <Printer size={18} />
                        <span className="hidden sm:inline">Entrega</span>
                      </button>
                    )}
                    {formData.paymentStatus === 'parcial' ? (
                      <button 
                        onClick={() => triggerPrint('receipt-partial')}
                        className="btn-3d btn-3d-secondary p-2 text-emerald-600 flex items-center gap-2 text-sm"
                        title="Imprimir Recibo Parcial"
                      >
                        <Printer size={18} />
                        <span className="hidden sm:inline">Recibo Parcial</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => triggerPrint('receipt-total')}
                        className="btn-3d btn-3d-secondary p-2 text-emerald-600 flex items-center gap-2 text-sm"
                        title="Imprimir Recibo Total"
                      >
                        <Printer size={18} />
                        <span className="hidden sm:inline">Recibo Total</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1 border-l border-slate-200/60 pl-2">
              <button 
                onClick={() => setIsMinimized(true)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" 
                title="Minimizar"
              >
                <Minus size={18} />
              </button>
              <button 
                onClick={() => setIsMaximized(!isMaximized)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" 
                title={isMaximized ? "Restaurar" : "Maximizar"}
              >
                {isMaximized ? <Maximize2 size={18} /> : <Square size={18} />}
              </button>
              <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
          
          {/* Cliente Info */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 card-3d p-5 bg-white">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                Dados do Cliente
              </h3>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Nome do Cliente *</label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                  <input 
                    type="text" 
                    value={formData.customerName} 
                    onChange={e => {
                      if (isReadOnly) return;
                      setFormData({...formData, customerName: e.target.value});
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => !isReadOnly && setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    disabled={isReadOnly}
                    className="input-3d pl-9 pr-3 py-2 w-full"
                    placeholder="Buscar ou digitar nome..."
                  />
                </div>
                {!isReadOnly && showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filteredCustomers.map(c => (
                      <div 
                        key={c.id}
                        onClick={() => {
                          setFormData({...formData, customerName: c.name, customerPhone: c.phone});
                          setShowCustomerDropdown(false);
                        }}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        {c.phone && <p className="text-xs text-slate-500">{c.phone}</p>}
                      </div>
                    ))}
                    <div 
                      onClick={() => {
                        setShowCustomerDropdown(false);
                        setIsCustomerModalOpen(true);
                      }}
                      className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 cursor-pointer flex items-center gap-2 text-indigo-700 text-sm font-medium transition-colors sticky bottom-0 backdrop-blur-sm border-t border-indigo-100"
                    >
                      <UserPlus size={16} />
                      Cadastrar Novo Cliente
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Telefone</label>
                <input 
                  type="text" 
                  value={formData.customerPhone} 
                  onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                  className="input-3d w-full px-3 py-2"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-4 card-3d p-5 bg-white">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                Status & Prazos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Funcionário Responsável</label>
                  <select 
                    value={formData.employeeId || ''} 
                    onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    className="input-3d w-full px-3 py-2"
                    disabled={isReadOnly}
                  >
                    <option value="">Selecione um funcionário...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Status de Produção</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="input-3d w-full px-3 py-2 uppercase text-xs font-medium"
                    disabled={isReadOnly}
                  >
                    {productionStatuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Data de Entrega</label>
                  <input 
                    type="date" 
                    value={formData.estimatedDeliveryDate} 
                    onChange={e => setFormData({...formData, estimatedDeliveryDate: e.target.value})}
                    className="input-3d w-full px-3 py-2"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Produtos */}
          <section className="space-y-4 card-3d p-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                Itens do Pedido
              </h3>
              <button 
                onClick={addItem}
                className="btn-3d btn-3d-secondary px-3 py-1.5 text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Adicionar Item
              </button>
            </div>

            <div className="space-y-4">
              {(formData.items || []).map((item, index) => (
                <div key={item.id} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 relative group hover:bg-white hover:shadow-md transition-all duration-300">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="absolute -top-2 -right-2 bg-white text-rose-500 p-1.5 rounded-full shadow-md border border-slate-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 hover:scale-110 z-10"
                    title="Remover item"
                  >
                    <Trash2 size={14} />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-3">
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Produto / Serviço</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={e => {
                            updateItem(item.id, 'name', e.target.value);
                            setActiveItemIndex(index);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => {
                            setActiveItemIndex(index);
                            setShowProductDropdown(true);
                          }}
                          onBlur={() => setTimeout(() => {
                            if (activeItemIndex === index) setShowProductDropdown(false);
                          }, 200)}
                          className="input-3d w-full px-3 py-2"
                          placeholder="Buscar ou digitar produto..."
                        />
                        {showProductDropdown && activeItemIndex === index && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                            {getFilteredProducts(item.name).map(p => (
                              <div key={p.id}>
                                <div 
                                  onClick={() => handleSelectProduct(item.id, p)}
                                  className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors"
                                >
                                  <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                                    <p className="text-xs font-mono text-slate-500">R$ {p.basePrice.toFixed(2)}</p>
                                  </div>
                                  <div className="flex gap-2 mt-0.5">
                                    {p.code && <p className="text-[10px] text-slate-400">Cód: {p.code}</p>}
                                    {p.barcode && <p className="text-[10px] text-indigo-400">EAN: {p.barcode}</p>}
                                  </div>
                                </div>
                                {p.variations?.map(v => (
                                  <div 
                                    key={v.id}
                                    onClick={() => handleSelectProduct(item.id, p, v)}
                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 pl-8 bg-slate-50/50 transition-colors"
                                  >
                                    <div className="flex justify-between items-center">
                                      <p className="text-xs font-medium text-slate-700">↳ {v.name}</p>
                                      <p className="text-xs font-mono text-slate-500">R$ {v.price.toFixed(2)}</p>
                                    </div>
                                    {v.barcode && <p className="text-[10px] text-indigo-400 mt-0.5 ml-3">EAN: {v.barcode}</p>}
                                  </div>
                                ))}
                              </div>
                            ))}
                            <div 
                              onClick={() => {
                                setShowProductDropdown(false);
                                setIsProductModalOpen(true);
                              }}
                              className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 cursor-pointer flex items-center gap-2 text-indigo-700 text-sm font-medium transition-colors sticky bottom-0 backdrop-blur-sm border-t border-indigo-100"
                            >
                              <Plus size={16} />
                              Cadastrar Novo Produto
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qtd</label>
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity} 
                        onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                        className="input-3d w-full px-3 py-2 text-center"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Custo Unit. (R$)</label>
                      <input 
                        type="number" 
                        min="0" step="0.01"
                        value={item.costPrice} 
                        onChange={e => updateItem(item.id, 'costPrice', Number(e.target.value))}
                        className="input-3d w-full px-3 py-2 text-right"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Unit. (R$)</label>
                      <input 
                        type="number" 
                        min="0" step="0.01"
                        value={item.unitPrice} 
                        onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                        className="input-3d w-full px-3 py-2 text-right"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desconto</label>
                      <div className="flex shadow-sm rounded-xl">
                        <select 
                          value={item.discountType}
                          onChange={e => updateItem(item.id, 'discountType', e.target.value)}
                          className="px-2 py-2 bg-slate-50 border border-slate-200 border-r-0 rounded-l-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-slate-100 font-medium text-slate-600"
                        >
                          <option value="value">R$</option>
                          <option value="percentage">%</option>
                        </select>
                        <input 
                          type="number" 
                          min="0" step="0.01"
                          value={item.discountValue} 
                          onChange={e => updateItem(item.id, 'discountValue', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-r-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <input 
                        type="text" 
                        value={item.observations} 
                        onChange={e => updateItem(item.id, 'observations', e.target.value)}
                        className="w-full px-3 py-1.5 bg-transparent border-b border-slate-200 text-xs focus:border-indigo-500 outline-none text-slate-600 placeholder-slate-400 transition-colors"
                        placeholder="Observações do item (opcional)"
                      />
                    </div>
                    <div className="text-right bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase mr-2">Total Item:</span>
                      <span className="font-mono font-bold text-indigo-700">
                        R$ {calculateItemTotal(item).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {(formData.items?.length === 0) && (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200/60 rounded-xl bg-slate-50/30">
                  Nenhum item adicionado.
                </div>
              )}
            </div>
          </section>

          {/* Pagamento e Totais */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-100/50 p-6 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-slate-500 rounded-full"></span>
                Pagamento
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Status</label>
                  <select 
                    value={formData.paymentStatus} 
                    onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                    className="input-3d w-full px-3 py-2 uppercase text-xs font-medium"
                  >
                    {paymentStatuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Forma</label>
                  <select 
                    value={formData.paymentMethod} 
                    onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                    className="input-3d w-full px-3 py-2 uppercase text-xs font-medium"
                  >
                    {paymentMethods.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Valor Pago (R$)</label>
                <input 
                  type="number" 
                  min="0" step="0.01"
                  value={formData.amountPaid} 
                  onChange={e => setFormData({...formData, amountPaid: Number(e.target.value)})}
                  className="input-3d w-full px-3 py-2 font-mono text-lg font-bold text-emerald-700"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                Resumo Financeiro
              </h3>
              
              <div className="space-y-3 text-sm bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-mono font-bold">R$ {calculateSubtotal().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Desconto Geral:</span>
                  <div className="flex w-32 shadow-sm rounded-xl">
                    <select 
                      value={formData.generalDiscountType}
                      onChange={e => setFormData({...formData, generalDiscountType: e.target.value as DiscountType})}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 border-r-0 rounded-l-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-600"
                    >
                      <option value="value">R$</option>
                      <option value="percentage">%</option>
                    </select>
                    <input 
                      type="number" 
                      min="0" step="0.01"
                      value={formData.generalDiscountValue} 
                      onChange={e => setFormData({...formData, generalDiscountValue: Number(e.target.value)})}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-r-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-right font-mono shadow-inner"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-base">Total Final:</span>
                  <span className="font-mono font-bold text-2xl text-indigo-700">R$ {calculateTotal().toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-base">Lucro Total:</span>
                  <span className="font-mono font-bold text-xl text-emerald-700">R$ {(calculateTotal() - (formData.items || []).reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)).toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-bold uppercase">Falta Pagar:</span>
                  <span className={`font-mono font-bold text-sm ${calculateTotal() - (formData.amountPaid || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    R$ {Math.max(0, calculateTotal() - (formData.amountPaid || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Observações Gerais */}
          <section className="card-3d p-5 bg-white">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Observações Gerais do Pedido</label>
            <textarea 
              value={formData.generalObservations} 
              onChange={e => setFormData({...formData, generalObservations: e.target.value})}
              className="input-3d w-full px-3 py-2 min-h-[80px]"
              placeholder="Anotações importantes sobre este pedido..."
            />
          </section>

          {/* Entrega */}
          <section className="card-3d p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                Informações de Entrega
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.deliveryInfo?.isDelivery || false}
                  onChange={e => setFormData({
                    ...formData, 
                    deliveryInfo: {
                      ...(formData.deliveryInfo || {
                        isDelivery: false,
                        senderName: '',
                        receiverName: '',
                        phone: '',
                        address: '',
                        referencePoint: '',
                        observations: '',
                        paymentAtLocation: false,
                      }),
                      isDelivery: e.target.checked,
                      receiverName: e.target.checked ? (formData.customerName || '') : '',
                      phone: e.target.checked ? (formData.customerPhone || '') : '',
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                <span className="ml-3 text-xs font-bold text-slate-600 uppercase">Pedido para Entrega?</span>
              </label>
            </div>

            {formData.deliveryInfo?.isDelivery && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Quem está enviando (Remetente)</label>
                  <input 
                    type="text" 
                    value={formData.deliveryInfo.senderName} 
                    onChange={e => setFormData({
                      ...formData, 
                      deliveryInfo: { ...formData.deliveryInfo!, senderName: e.target.value }
                    })}
                    className="input-3d w-full px-3 py-2"
                    placeholder="Nome da empresa ou pessoa..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Quem vai receber (Destinatário)</label>
                  <input 
                    type="text" 
                    value={formData.deliveryInfo.receiverName} 
                    onChange={e => setFormData({
                      ...formData, 
                      deliveryInfo: { ...formData.deliveryInfo!, receiverName: e.target.value }
                    })}
                    className="input-3d w-full px-3 py-2"
                    placeholder="Nome de quem recebe..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Telefone de Contato</label>
                  <input 
                    type="text" 
                    value={formData.deliveryInfo.phone} 
                    onChange={e => setFormData({
                      ...formData, 
                      deliveryInfo: { ...formData.deliveryInfo!, phone: e.target.value }
                    })}
                    className="input-3d w-full px-3 py-2"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Ponto de Referência</label>
                  <input 
                    type="text" 
                    value={formData.deliveryInfo.referencePoint} 
                    onChange={e => setFormData({
                      ...formData, 
                      deliveryInfo: { ...formData.deliveryInfo!, referencePoint: e.target.value }
                    })}
                    className="input-3d w-full px-3 py-2"
                    placeholder="Ex: Próximo ao mercado..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={formData.deliveryInfo.address} 
                    onChange={e => setFormData({
                      ...formData, 
                      deliveryInfo: { ...formData.deliveryInfo!, address: e.target.value }
                    })}
                    className="input-3d w-full px-3 py-2"
                    placeholder="Rua, número, bairro, cidade..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Observações da Entrega</label>
                  <textarea 
                    value={formData.deliveryInfo.observations} 
                    onChange={e => setFormData({
                      ...formData, 
                      deliveryInfo: { ...formData.deliveryInfo!, observations: e.target.value }
                    })}
                    className="input-3d w-full px-3 py-2 min-h-[60px]"
                    placeholder="Instruções para o entregador..."
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-4 bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.deliveryInfo.paymentAtLocation}
                      onChange={e => setFormData({
                        ...formData, 
                        deliveryInfo: { ...formData.deliveryInfo!, paymentAtLocation: e.target.checked }
                      })}
                      className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                    />
                    <span className="text-xs font-bold text-orange-800 uppercase">Receber pagamento no local?</span>
                  </label>
                  <div className="ml-auto text-right">
                    <p className="text-[10px] font-bold text-orange-600 uppercase">Valor a Receber:</p>
                    <p className="text-sm font-black text-orange-800">
                      R$ {formData.deliveryInfo.paymentAtLocation ? Math.max(0, calculateTotal() - (formData.amountPaid || 0)).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Área de Exclusão/Cancelamento */}
          {order && showDeleteConfirm && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mt-8 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-bold text-rose-800 text-sm">Cancelar Pedido</h4>
                  <p className="text-xs text-rose-600 mt-1 mb-3">
                    Esta ação cancelará o pedido. É obrigatório informar o motivo.
                  </p>
                  <textarea 
                    value={deleteReason}
                    onChange={e => setDeleteReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none min-h-[60px] mb-3 shadow-inner"
                    placeholder="Motivo do cancelamento..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="btn-3d btn-3d-danger px-3 py-1.5 text-xs"
                    >
                      Confirmar Cancelamento
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/50 backdrop-blur-sm flex items-center justify-between">
          {!isReadOnly && order ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-3d bg-white text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 px-4 py-2 text-sm flex items-center gap-2"
              >
                <Archive size={16} />
                <span className="hidden sm:inline">Cancelar</span>
              </button>
              <button 
                onClick={() => setShowFinalizeConfirm(true)}
                className="btn-3d bg-white text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-300 px-4 py-2 text-sm flex items-center gap-2"
              >
                <CheckCircle size={16} />
                <span className="hidden sm:inline">Finalizar</span>
              </button>
            </div>
          ) : (
            <div></div>
          )}
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Fechar
            </button>
            {!isReadOnly && (
              <>
                {(!order || order.isQuotation) && (
                  <button 
                    onClick={() => handleSave(true)}
                    className="btn-3d bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 px-4 py-2 text-sm flex items-center gap-2"
                  >
                    <Save size={16} />
                    {order?.isQuotation ? 'Salvar Cotação' : 'Salvar como Cotação'}
                  </button>
                )}
                <button 
                  onClick={() => handleSave(false)}
                  className="btn-3d btn-3d-primary px-6 py-2 text-sm flex items-center gap-2"
                >
                  <Save size={16} />
                  {order?.isQuotation ? 'Converter em Pedido' : 'Salvar Pedido'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Print Template */}
      <div className="hidden">
        <div ref={printRef}>
          {printType && order && (
            <PrintTemplate 
              order={order} 
              companyInfo={companyInfo} 
              type={printType} 
              employees={employees}
            />
          )}
        </div>
      </div>

      {showFinalizeConfirm && order && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="window-panel max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="text-emerald-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Finalizar Pedido</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Deseja realmente finalizar este pedido? Ele será marcado como entregue e pago, e movido para a seção de Finalizados.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowFinalizeConfirm(false)}
                  className="btn-3d btn-3d-secondary px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    finalizeOrder(order.id, calculateOrderTotal(formData));
                    setShowFinalizeConfirm(false);
                    onClose();
                  }}
                  className="btn-3d btn-3d-success px-4 py-2 text-sm"
                >
                  Sim, Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCustomerModalOpen && (
        <CustomerModal 
          onClose={() => setIsCustomerModalOpen(false)} 
          onSelect={(customer) => {
            setFormData(prev => ({...prev, customerName: customer.name, customerPhone: customer.phone}));
          }}
        />
      )}

      {isProductModalOpen && (
        <ProductModal 
          onClose={() => setIsProductModalOpen(false)} 
          onProductAdded={(product) => {
            if (activeItemIndex !== null) {
              const items = [...(formData.items || [])];
              if (items[activeItemIndex]) {
                items[activeItemIndex] = {
                  ...items[activeItemIndex],
                  name: product.name,
                  unitPrice: product.basePrice
                };
                setFormData(prev => ({...prev, items}));
              }
            }
          }}
        />
      )}
    </div>
  );
}
