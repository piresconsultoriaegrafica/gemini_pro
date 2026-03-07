import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../store';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, User, 
  CreditCard, Banknote, QrCode, Percent, Tag, 
  X, CheckCircle, AlertCircle, Package, ArrowRight
} from 'lucide-react';
import { Product, ProductItem, DiscountType, Order, CompanyInfo } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PrintTemplate } from './PrintTemplate';
import { ProductModal } from './ProductModal';

export function PDVView() {
  const { products, addOrder, paymentMethods, paymentStatuses, companyInfo, employees } = useAppContext();
  
  const [cart, setCart] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<{ method: string, amount: number }[]>([]);
  const [generalDiscountValue, setGeneralDiscountValue] = useState(0);
  const [generalDiscountType, setGeneralDiscountType] = useState<DiscountType>('value');
  const [surcharge, setSurcharge] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [printCopies, setPrintCopies] = useState<'client' | 'establishment' | 'both'>('both');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lower = searchTerm.toLowerCase();
    
    const results: { type: 'product' | 'variation' | 'manual', data: any }[] = [];

    products.forEach(p => {
      // Check main product
      if (p.name.toLowerCase().includes(lower) || p.code.toLowerCase().includes(lower) || p.barcode?.includes(lower)) {
        results.push({ type: 'product', data: p });
      }
      
      // Check variations
      p.variations?.forEach(v => {
        if (v.name.toLowerCase().includes(lower) || v.barcode?.includes(lower)) {
          results.push({ type: 'variation', data: { ...v, parentName: p.name, parentId: p.id, costPrice: v.costPrice || p.costPrice } });
        }
      });
    });

    // Add manual option if no exact match or just as a utility
    results.push({ 
      type: 'manual', 
      data: { name: searchTerm, basePrice: 0 } 
    });

    return results.slice(0, 8);
  }, [products, searchTerm]);

  const addToCart = (itemData: any, type: 'product' | 'variation' | 'manual') => {
    let newItem: ProductItem;
    
    if (type === 'product') {
      const product = itemData as Product;
      newItem = {
        id: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.basePrice,
        costPrice: product.costPrice,
        discountType: 'value',
        discountValue: 0,
        observations: product.isKit ? 'Kit de produtos' : ''
      };
    } else if (type === 'variation') {
      newItem = {
        id: `${itemData.parentId}-${itemData.id}`,
        name: `${itemData.parentName} (${itemData.name})`,
        quantity: 1,
        unitPrice: itemData.price,
        costPrice: itemData.costPrice,
        discountType: 'value',
        discountValue: 0,
        observations: 'Variação'
      };
    } else {
      // Manual
      newItem = {
        id: `manual-${uuidv4()}`,
        name: itemData.name || 'Produto Avulso',
        quantity: 1,
        unitPrice: 0,
        costPrice: 0,
        discountType: 'value',
        discountValue: 0,
        observations: 'Item Manual'
      };
    }

    const existingIndex = cart.findIndex(item => item.id === newItem.id && type !== 'manual');
    if (existingIndex > -1 && type !== 'manual') {
      setCart(cart.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, newItem]);
    }
    
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, value: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0.001, value);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateUnitPrice = (id: string, value: number) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, unitPrice: value } : item
    ));
  };

  const updateItemDiscount = (id: string, value: number) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, discountValue: value } : item
    ));
  };

  const updateItemDiscountType = (id: string, type: DiscountType) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, discountType: type } : item
    ));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const discount = item.discountType === 'percentage' 
        ? (itemTotal * item.discountValue) / 100 
        : item.discountValue;
      return acc + (itemTotal - discount);
    }, 0);
  }, [cart]);

  const totalDiscount = useMemo(() => {
    if (generalDiscountType === 'percentage') {
      return (subtotal * generalDiscountValue) / 100;
    }
    return generalDiscountValue;
  }, [subtotal, generalDiscountValue, generalDiscountType]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount + surcharge);
  }, [subtotal, totalDiscount, surcharge]);

  const totalPaid = useMemo(() => {
    return selectedPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [selectedPayments]);

  const remainingAmount = useMemo(() => {
    return Math.max(0, total - totalPaid);
  }, [total, totalPaid]);

  const changeAmount = useMemo(() => {
    return Math.max(0, totalPaid - total);
  }, [total, totalPaid]);

  const addPayment = (method: string) => {
    if (remainingAmount <= 0) return;
    
    const existing = selectedPayments.find(p => p.method === method);
    if (existing) {
      setSelectedPayments(selectedPayments.map(p => 
        p.method === method ? { ...p, amount: p.amount + remainingAmount } : p
      ));
    } else {
      setSelectedPayments([...selectedPayments, { method, amount: remainingAmount }]);
    }
  };

  const removePayment = (index: number) => {
    setSelectedPayments(selectedPayments.filter((_, i) => i !== index));
  };

  const updatePaymentAmount = (index: number, amount: number) => {
    setSelectedPayments(selectedPayments.map((p, i) => 
      i === index ? { ...p, amount } : p
    ));
  };

  const handleFinalize = () => {
    if (cart.length === 0) return;
    if (totalPaid < total && selectedPayments.length > 0) {
      if (!confirm(`O valor pago (R$ ${totalPaid.toFixed(2)}) é menor que o total (R$ ${total.toFixed(2)}). Deseja continuar?`)) {
        return;
      }
    }
    
    const firstPayStatus = totalPaid >= total ? (paymentStatuses.find(s => s.label.toLowerCase().includes('pago'))?.label || 'pago') : (paymentStatuses[0]?.label || 'pendente');

    const paymentMethodString = selectedPayments.length > 0 
      ? selectedPayments.map(p => `${p.method}: R$ ${p.amount.toFixed(2)}`).join(', ')
      : 'Não especificado';

    const orderData: Omit<Order, 'id' | 'queueNumber' | 'createdAt' | 'archived'> = {
      customerName: customerName || 'Consumidor Final',
      customerPhone: '',
      items: cart,
      status: 'Entregue',
      paymentStatus: firstPayStatus,
      paymentMethod: paymentMethodString,
      generalDiscountType: generalDiscountType,
      generalDiscountValue: generalDiscountValue,
      amountPaid: totalPaid > total ? total : totalPaid,
      generalObservations: `Venda PDV - Acréscimo: R$ ${surcharge.toFixed(2)}`,
      estimatedDeliveryDate: new Date().toISOString(),
      finalized: true,
      origin: 'pdv',
    };

    const newOrder = addOrder(orderData);
    setLastOrder(newOrder);
    setShowPrintModal(true);
  };

  const finalizeAndPrint = () => {
    setShowPrintModal(false);
    setShowSuccess(true);
    
    // Trigger print
    setTimeout(() => {
      window.print();
    }, 500);

    setCart([]);
    setCustomerName('');
    setGeneralDiscountValue(0);
    setSurcharge(0);
    setSelectedPayments([]);
    
    setTimeout(() => {
      setShowSuccess(false);
      searchInputRef.current?.focus();
    }, 3000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
            <ShoppingCart className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Venda Rápida (PDV)</h1>
            <p className="text-sm text-slate-500">Realize vendas de forma ágil e simplificada.</p>
          </div>
        </div>
        
        {showSuccess && (
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle size={20} />
            <span className="font-semibold">Venda finalizada com sucesso!</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Column: Search and Cart */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Search Section */}
          <div className="card-3d p-6 bg-white shrink-0 z-30 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Busque por nome, código ou código de barras..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-3d w-full pl-12 pr-4 py-3.5 text-lg"
              />
              
              {filteredResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {filteredResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => addToCart(result.data, result.type)}
                      className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
                    >
                      <div className="text-left">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {result.type === 'product' && result.data.isKit && <Package size={14} className="text-amber-500" />}
                          {result.type === 'variation' && <Tag size={14} className="text-indigo-400" />}
                          {result.type === 'manual' && <Plus size={14} className="text-emerald-500" />}
                          {result.type === 'variation' ? `${result.data.parentName} - ${result.data.name}` : result.data.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {result.type === 'manual' ? 'Adicionar como item manual' : `Cód: ${result.data.code || 'N/A'} | ${result.data.barcode || 'Sem barras'}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-indigo-600 font-bold">
                          {result.type === 'manual' ? 'Definir preço no carrinho' : `R$ ${result.data.basePrice?.toFixed(2) || result.data.price?.toFixed(2)}`}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Clique para adicionar</div>
                      </div>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => { setIsProductModalOpen(true); setSearchTerm(''); }}
                    className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 transition-colors border-t border-slate-100 bg-slate-50"
                  >
                    <div className="flex items-center gap-2 font-bold text-indigo-600">
                      <Plus size={14} />
                      Cadastrar Novo Produto
                    </div>
                    <div className="text-[10px] text-indigo-400 uppercase tracking-wider">Clique para cadastrar</div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="card-3d flex-1 bg-white overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <Package size={18} className="text-indigo-500" />
                Itens da Venda
              </h2>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {cart.length} {cart.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <ShoppingCart size={64} className="mb-4" />
                  <p className="text-lg font-medium">Seu carrinho está vazio</p>
                  <p className="text-sm">Busque produtos acima para começar a venda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                      <div className="flex-1">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">R$</span>
                          <input 
                            type="number"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="bg-transparent border-b border-dashed border-slate-200 text-xs font-bold text-indigo-600 w-20 focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <input 
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                          className="w-12 text-center font-bold text-slate-700 focus:outline-none bg-transparent"
                        />
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="w-32">
                        <div className="relative flex items-center gap-1">
                          <select 
                            value={item.discountType}
                            onChange={(e) => updateItemDiscountType(item.id, e.target.value as DiscountType)}
                            className="bg-slate-100 text-[10px] px-1 py-1 rounded border border-slate-200 focus:outline-none"
                          >
                            <option value="value">R$</option>
                            <option value="percentage">%</option>
                          </select>
                          <div className="relative flex-1">
                            <Tag className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                            <input 
                              type="number" 
                              placeholder="Desc."
                              value={item.discountValue || ''}
                              onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                              className="input-3d w-full pl-6 pr-1 py-1.5 text-xs text-right"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="w-28 text-right">
                        <div className="text-sm font-bold text-slate-800">
                          R$ {((item.quantity * item.unitPrice) - item.discountValue).toFixed(2)}
                        </div>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Summary and Finalization */}
        <div className="w-96 flex flex-col gap-6 shrink-0">
          {/* Customer and Payment Info */}
          <div className="card-3d p-6 bg-white space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <User size={14} />
                Cliente (Opcional)
              </label>
              <input 
                type="text" 
                placeholder="Nome do cliente..." 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-3d w-full px-4 py-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CreditCard size={14} />
                Formas de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => addPayment(method.label)}
                    disabled={remainingAmount <= 0}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      remainingAmount <= 0 
                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {method.label.toLowerCase().includes('pix') && <QrCode size={14} />}
                    {method.label.toLowerCase().includes('espécie') && <Banknote size={14} />}
                    {method.label.toLowerCase().includes('cartão') && <CreditCard size={14} />}
                    <span className="truncate">{method.label}</span>
                  </button>
                ))}
              </div>

              {selectedPayments.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedPayments.map((p, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-right-2 duration-200">
                      <span className="text-xs font-bold text-slate-600 flex-1 truncate">{p.method}</span>
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
                        <span className="text-[10px] text-slate-400 font-bold">R$</span>
                        <input 
                          type="number"
                          value={p.amount || ''}
                          onChange={(e) => updatePaymentAmount(index, parseFloat(e.target.value) || 0)}
                          className="w-16 text-right text-xs font-bold text-slate-700 focus:outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => removePayment(index)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {remainingAmount > 0 && selectedPayments.length > 0 && (
                <div className="mt-3 flex items-center justify-between px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Faltando</span>
                  <span className="text-xs font-black text-amber-700">R$ {remainingAmount.toFixed(2)}</span>
                </div>
              )}

              {changeAmount > 0 && (
                <div className="mt-3 flex items-center justify-between px-2 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 animate-bounce">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Troco</span>
                  <span className="text-xs font-black text-emerald-700">R$ {changeAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Totals Section */}
          <div className="card-3d p-6 bg-indigo-900 text-white flex flex-col gap-4 shadow-2xl shadow-indigo-200">
            <div className="space-y-3">
              <div className="flex justify-between text-indigo-200 text-sm">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-indigo-200 text-sm">
                  <Percent size={14} />
                  <span>Desconto Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={generalDiscountType}
                    onChange={(e) => setGeneralDiscountType(e.target.value as DiscountType)}
                    className="bg-indigo-800 text-white text-[10px] px-1 py-1 rounded border border-indigo-700 focus:outline-none"
                  >
                    <option value="value">R$</option>
                    <option value="percentage">%</option>
                  </select>
                  <input 
                    type="number" 
                    value={generalDiscountValue || ''}
                    onChange={(e) => setGeneralDiscountValue(parseFloat(e.target.value) || 0)}
                    className="bg-indigo-800 text-white text-right w-20 px-2 py-1 rounded border border-indigo-700 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-indigo-200 text-sm">
                  <Plus size={14} />
                  <span>Acréscimos</span>
                </div>
                <input 
                  type="number" 
                  value={surcharge || ''}
                  onChange={(e) => setSurcharge(parseFloat(e.target.value) || 0)}
                  className="bg-indigo-800 text-white text-right w-20 px-2 py-1 rounded border border-indigo-700 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-indigo-800 mt-2">
              <div className="flex justify-between items-end">
                <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Total a Pagar</div>
                <div className="text-4xl font-black tracking-tighter">R$ {total.toFixed(2)}</div>
              </div>
            </div>

            <button
              onClick={handleFinalize}
              disabled={cart.length === 0}
              className={`w-full mt-4 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                cart.length === 0 
                  ? 'bg-indigo-800 text-indigo-400 cursor-not-allowed' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-900/20 active:scale-95'
              }`}
            >
              Finalizar Venda
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Print Selection Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="text-indigo-600" />
                Opções de Impressão
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <p className="text-slate-600 text-center font-medium">
                Venda registrada com sucesso! Como deseja imprimir o comprovante?
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => { setPrintCopies('client'); finalizeAndPrint(); }}
                  className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <User className="text-slate-600 group-hover:text-indigo-600" size={20} />
                    </div>
                    <span className="font-bold text-slate-700">Somente Via Cliente</span>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500" />
                </button>

                <button 
                  onClick={() => { setPrintCopies('establishment'); finalizeAndPrint(); }}
                  className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <Package className="text-slate-600 group-hover:text-indigo-600" size={20} />
                    </div>
                    <span className="font-bold text-slate-700">Somente Via Estabelecimento</span>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500" />
                </button>

                <button 
                  onClick={() => { setPrintCopies('both'); finalizeAndPrint(); }}
                  className="flex items-center justify-between p-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-xl group-hover:bg-indigo-200 transition-colors">
                      <CheckCircle className="text-indigo-600" size={20} />
                    </div>
                    <span className="font-bold text-indigo-700">Imprimir as Duas Vias</span>
                  </div>
                  <ArrowRight size={18} className="text-indigo-400 group-hover:text-indigo-600" />
                </button>
              </div>

              <button 
                onClick={() => {
                  setCart([]);
                  setCustomerName('');
                  setGeneralDiscountValue(0);
                  setSurcharge(0);
                  setSelectedPayments([]);
                  setShowPrintModal(false);
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                }}
                className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Não imprimir agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Area */}
      <div className="hidden print:block">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; }
            @page { margin: 0; }
          }
        `}} />
        <div id="print-area" ref={printRef}>
          {lastOrder && (
            <>
              {(printCopies === 'client' || printCopies === 'both') && (
                <div className="mb-8">
                  <div className="text-center font-bold text-[10px] mb-2 uppercase border-b border-black pb-1">Via do Cliente</div>
                  <PrintTemplate order={lastOrder} companyInfo={companyInfo} type="order" employees={employees} detailLevel="detailed" />
                </div>
              )}
              {printCopies === 'both' && <div className="border-t border-black border-dashed my-8"></div>}
              {(printCopies === 'establishment' || printCopies === 'both') && (
                <div>
                  <div className="text-center font-bold text-[10px] mb-2 uppercase border-b border-black pb-1">Via do Estabelecimento</div>
                  <PrintTemplate order={lastOrder} companyInfo={companyInfo} type="order" employees={employees} detailLevel="simple" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isProductModalOpen && (
        <ProductModal 
          onClose={() => setIsProductModalOpen(false)}
          onProductAdded={(product) => {
            addToCart(product, 'product');
            setIsProductModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
