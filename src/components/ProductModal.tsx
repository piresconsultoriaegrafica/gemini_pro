import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Minus, Square, Maximize2, Search } from 'lucide-react';
import { useAppContext } from '../store';
import { Product, ProductVariation } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ProductModalProps {
  onClose: () => void;
  onProductAdded?: (product: Product) => void;
  productToEdit?: Product | null;
}

export function ProductModal({ onClose, onProductAdded, productToEdit }: ProductModalProps) {
  const { addProduct, updateProduct, products } = useAppContext();
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    code: '',
    barcode: '',
    name: '',
    description: '',
    basePrice: 0,
    costPrice: 0,
    markup: 0,
    isKit: false,
    composition: [],
    variations: [],
  });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [compositionSearch, setCompositionSearch] = useState('');
  const [showCompositionDropdown, setShowCompositionDropdown] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        code: productToEdit.code || '',
        barcode: productToEdit.barcode || '',
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        basePrice: productToEdit.basePrice || 0,
        costPrice: productToEdit.costPrice || 0,
        markup: productToEdit.markup || 0,
        isKit: productToEdit.isKit || false,
        composition: productToEdit.composition || [],
        variations: productToEdit.variations || [],
      });
    }
  }, [productToEdit]);

  // Calculate markup when basePrice or costPrice changes
  const updateMarkup = (base: number, cost: number) => {
    if (cost > 0) {
      const m = ((base / cost) - 1) * 100;
      return parseFloat(m.toFixed(2));
    }
    return 0;
  };

  // Calculate basePrice when costPrice or markup changes
  const updateBasePrice = (cost: number, markup: number) => {
    const b = cost * (1 + markup / 100);
    return parseFloat(b.toFixed(2));
  };

  const handleCostPriceChange = (cost: number) => {
    const newBasePrice = updateBasePrice(cost, formData.markup);
    setFormData(prev => ({ ...prev, costPrice: cost, basePrice: newBasePrice }));
  };

  const handleMarkupChange = (markup: number) => {
    const newBasePrice = updateBasePrice(formData.costPrice, markup);
    setFormData(prev => ({ ...prev, markup, basePrice: newBasePrice }));
  };

  const handleBasePriceChange = (base: number) => {
    const newMarkup = updateMarkup(base, formData.costPrice);
    setFormData(prev => ({ ...prev, basePrice: base, markup: newMarkup }));
  };

  const calculateCompositionCost = (composition: any[]) => {
    return composition.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? (product.costPrice || 0) * item.quantity : 0);
    }, 0);
  };

  const handleAddCompositionItem = (productId: string) => {
    const newComposition = [...formData.composition, { productId, quantity: 1 }];
    const newCostPrice = calculateCompositionCost(newComposition);
    const newBasePrice = updateBasePrice(newCostPrice, formData.markup);
    
    setFormData(prev => ({ 
      ...prev, 
      composition: newComposition,
      costPrice: newCostPrice,
      basePrice: newBasePrice
    }));
    setCompositionSearch('');
    setShowCompositionDropdown(false);
  };

  const handleUpdateCompositionQuantity = (productId: string, quantity: number) => {
    const newComposition = formData.composition.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    );
    const newCostPrice = calculateCompositionCost(newComposition);
    const newBasePrice = updateBasePrice(newCostPrice, formData.markup);

    setFormData(prev => ({ 
      ...prev, 
      composition: newComposition,
      costPrice: newCostPrice,
      basePrice: newBasePrice
    }));
  };

  const handleRemoveCompositionItem = (productId: string) => {
    const newComposition = formData.composition.filter(item => item.productId !== productId);
    const newCostPrice = calculateCompositionCost(newComposition);
    const newBasePrice = updateBasePrice(newCostPrice, formData.markup);

    setFormData(prev => ({ 
      ...prev, 
      composition: newComposition,
      costPrice: newCostPrice,
      basePrice: newBasePrice
    }));
  };

  const filteredCompositionProducts = products.filter(p => 
    p.id !== productToEdit?.id && // Don't allow self-composition
    (p.name.toLowerCase().includes(compositionSearch.toLowerCase()) || 
     p.code.toLowerCase().includes(compositionSearch.toLowerCase()) ||
     (p.barcode && p.barcode.toLowerCase().includes(compositionSearch.toLowerCase())))
  );

  const handleAddVariation = () => {
    setFormData((prev) => ({
      ...prev,
      variations: [
        ...prev.variations,
        { id: uuidv4(), name: '', price: 0 },
      ],
    }));
  };

  const handleUpdateVariation = (id: string, field: keyof ProductVariation, value: any) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((v) => 
        v.id === id ? { ...v, [field]: value } : v
      ),
    }));
  };

  const handleRemoveVariation = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((v) => v.id !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (productToEdit) {
      updateProduct(productToEdit.id, formData);
      if (onProductAdded) {
        onProductAdded({ ...formData, id: productToEdit.id } as Product);
      }
    } else {
      const newProduct: Product = {
        ...formData,
        id: uuidv4(),
      };
      addProduct(formData);
      if (onProductAdded) {
        onProductAdded(newProduct);
      }
    }
    
    onClose();
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
              {productToEdit ? 'Editar Produto' : 'Cadastrar Produto'}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); setIsMinimized(false); }} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                <Square size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-all duration-300 ${isMaximized ? 'p-0' : 'p-4'}`}>
      <div className={`card-3d bg-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl'}`}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/60 bg-slate-50/50 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
              <Maximize2 size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {productToEdit ? 'Editar Produto/Serviço' : 'Cadastrar Produto/Serviço'}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Minimizar">
              <Minus size={16} />
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title={isMaximized ? "Restaurar" : "Maximizar"}>
              {isMaximized ? <Maximize2 size={16} /> : <Square size={16} />}
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Fechar">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Código Interno</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input-3d w-full px-3 py-2 text-sm"
                  placeholder="Ex: CARTAO-VISITA"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Código de Barras (EAN/UPC)</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="input-3d w-full px-3 py-2 text-sm"
                  placeholder="Ex: 7891234567890"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Nome do Produto/Serviço</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-3d w-full px-3 py-2 text-sm"
                  placeholder="Ex: Cartão de Visita"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Preço de Custo (R$)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  disabled={formData.isKit}
                  value={formData.costPrice}
                  onChange={(e) => handleCostPriceChange(parseFloat(e.target.value) || 0)}
                  className="input-3d w-full px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {formData.isKit && <p className="text-[10px] text-indigo-600 mt-1 font-medium">Calculado pela composição</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Markup (%)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.markup}
                  onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                  className="input-3d w-full px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Preço de Venda (R$)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleBasePriceChange(parseFloat(e.target.value) || 0)}
                  className="input-3d w-full px-3 py-2 text-sm font-bold text-indigo-700"
                />
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                    Composição / Kit
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Defina se este item é composto por outros produtos/insumos.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.isKit}
                      onChange={(e) => setFormData(prev => ({ ...prev, isKit: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase">É um Kit/Composto</span>
                  </label>
                </div>
              </div>

              {formData.isKit && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input 
                      type="text" 
                      value={compositionSearch}
                      onChange={(e) => {
                        setCompositionSearch(e.target.value);
                        setShowCompositionDropdown(true);
                      }}
                      onFocus={() => setShowCompositionDropdown(true)}
                      placeholder="Buscar insumo ou produto para compor..."
                      className="input-3d w-full pl-9 pr-3 py-2 text-sm"
                    />
                    
                    {showCompositionDropdown && compositionSearch && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                        {filteredCompositionProducts.length > 0 ? (
                          filteredCompositionProducts.map(p => (
                            <div 
                              key={p.id}
                              onClick={() => handleAddCompositionItem(p.id)}
                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center transition-colors"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-800">{p.name}</p>
                                <div className="flex gap-2">
                                  <p className="text-[10px] text-slate-500">Cód: {p.code}</p>
                                  {p.barcode && <p className="text-[10px] text-indigo-500">EAN: {p.barcode}</p>}
                                </div>
                              </div>
                              <p className="text-xs font-mono text-slate-600">Custo: R$ {p.costPrice?.toFixed(2) || '0.00'}</p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center italic">Nenhum produto encontrado</div>
                        )}
                      </div>
                    )}
                  </div>

                  {formData.composition.length > 0 ? (
                    <div className="space-y-2">
                      {formData.composition.map((item) => {
                        const product = products.find(p => p.id === item.productId);
                        if (!product) return null;
                        return (
                          <div key={item.productId} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{product.name}</p>
                              <div className="flex gap-2">
                                <p className="text-[10px] text-slate-500">Custo Unit: R$ {product.costPrice?.toFixed(2) || '0.00'}</p>
                                {product.barcode && <p className="text-[10px] text-indigo-500">EAN: {product.barcode}</p>}
                              </div>
                            </div>
                            <div className="w-24">
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Qtd</label>
                              <input 
                                type="number" 
                                min="0.01"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => handleUpdateCompositionQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                className="input-3d w-full px-2 py-1 text-sm text-center"
                              />
                            </div>
                            <div className="w-24 text-right">
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Subtotal</label>
                              <p className="text-sm font-mono font-bold text-indigo-700">
                                R$ {((product.costPrice || 0) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleRemoveCompositionItem(item.productId)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-4"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                      <div className="flex justify-end pt-2">
                        <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                          <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide">Custo Total da Composição</p>
                          <p className="text-lg font-bold text-indigo-700 font-mono text-right">R$ {formData.costPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">
                      Adicione itens para compor este produto.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-3d w-full px-3 py-2 text-sm min-h-[80px]"
                placeholder="Descrição detalhada do produto ou serviço..."
              />
            </div>

            <div className="border-t border-slate-200/60 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
                    Variações (Opcional)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Adicione tamanhos, cores ou tipos diferentes (ex: P, M, G).</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariation}
                  className="btn-3d btn-3d-secondary px-3 py-1.5 text-xs flex items-center gap-1"
                >
                  <Plus size={14} />
                  Adicionar Variação
                </button>
              </div>

              {formData.variations.length > 0 ? (
                <div className="space-y-3">
                  {formData.variations.map((variation) => (
                    <div key={variation.id} className="flex flex-col gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-bold">Nome da Variação</label>
                          <input
                            type="text"
                            required
                            value={variation.name}
                            onChange={(e) => handleUpdateVariation(variation.id, 'name', e.target.value)}
                            className="input-3d w-full px-3 py-1.5 text-sm"
                            placeholder="Ex: Tamanho M"
                          />
                        </div>
                        <div className="w-48">
                          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-bold">Código de Barras</label>
                          <input
                            type="text"
                            value={variation.barcode || ''}
                            onChange={(e) => handleUpdateVariation(variation.id, 'barcode', e.target.value)}
                            className="input-3d w-full px-3 py-1.5 text-sm"
                            placeholder="EAN/UPC da variação"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-bold">Preço (R$)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">R$</span>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={variation.price}
                              onChange={(e) => handleUpdateVariation(variation.id, 'price', parseFloat(e.target.value) || 0)}
                              className="input-3d w-full pl-8 pr-3 py-1.5 text-sm font-mono font-bold text-slate-700"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariation(variation.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors mt-4"
                          title="Remover variação"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200/60 text-slate-400 text-sm">
                  Nenhuma variação cadastrada. O produto usará o valor base.
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/50 backdrop-blur-sm flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="product-form"
            className="btn-3d btn-3d-primary px-6 py-2 text-sm flex items-center gap-2"
          >
            <Save size={18} />
            Salvar Produto
          </button>
        </div>
      </div>
    </div>
  );
}
