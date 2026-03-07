import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../store';
import { Search, Plus, Edit2, Trash2, Printer, Download, FileText, Upload, AlertCircle, Package, Barcode, DollarSign, Tag, Layers } from 'lucide-react';
import { ProductModal } from './ProductModal';
import { PrintableProducts } from './PrintableProducts';
import { format } from 'date-fns';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { importFromExcel } from '../utils/importUtils';
import { v4 as uuidv4 } from 'uuid';

export function ProductsView() {
  const { products, addProducts, deleteProduct, companyInfo } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return (products || []).filter(p => {
      if (!searchLower) return true;
      
      const nameMatch = p.name?.toLowerCase().includes(searchLower);
      const codeMatch = p.code?.toLowerCase().includes(searchLower);
      const barcodeMatch = p.barcode?.toLowerCase().includes(searchLower);
      const descMatch = p.description?.toLowerCase().includes(searchLower);
      const variationBarcodeMatch = p.variations?.some(v => v.barcode?.toLowerCase().includes(searchLower));
      
      return nameMatch || codeMatch || barcodeMatch || descMatch || variationBarcodeMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm]);

  const handlePrint = () => {
    if (!printRef.current) return;

    const isDirectPrint = companyInfo?.directPrint;
    const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
    const title = `produtos_servicos_${dateStr}`;

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
  };

  const handleExportExcel = async () => {
    const data = filteredProducts.map(p => ({
      Código: p.code,
      Nome: p.name,
      Descrição: p.description || '-',
      'Valor Base': p.basePrice,
      'Variações': p.variations ? p.variations.map((v: any) => `${v.name}: R$ ${v.price.toFixed(2)}`).join(' | ') : '-'
    }));
    const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
    await exportToExcel(data, `produtos_servicos_${dateStr}`);
  };

  const handleExportPDF = async () => {
    const headers = ['Código', 'Nome', 'Valor Base', 'Variações'];
    const data = filteredProducts.map(p => [
      p.code,
      `${p.name}${p.description ? `\n${p.description}` : ''}`,
      `R$ ${p.basePrice.toFixed(2)}`,
      p.variations ? p.variations.map((v: any) => `${v.name}: R$ ${v.price.toFixed(2)}`).join('\n') : '-'
    ]);
    const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
    await exportToPDF('Lista de Produtos e Serviços', headers, data, `produtos_servicos_${dateStr}`, companyInfo);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromExcel(file);
      if (data && data.length > 0) {
        const newProducts = data.map((row: any) => {
          const basePriceStr = row['Valor Base'] || row.valor_base || row.basePrice || row.VALOR_BASE || row.Preço || row.preco || '0';
          const parsedPrice = parseFloat(String(basePriceStr).replace(',', '.').replace(/[^0-9.-]+/g,""));

          const costPriceStr = row['Preço de Custo'] || row.costPrice || row.preco_custo || '0';
          const parsedCost = parseFloat(String(costPriceStr).replace(',', '.').replace(/[^0-9.-]+/g,""));

          return {
            code: row.Código || row.codigo || row.code || row.CODIGO || '',
            name: row.Nome || row.name || row.NOME || '',
            description: row.Descrição || row.descricao || row.description || row.DESCRICAO || '',
            basePrice: isNaN(parsedPrice) ? 0 : parsedPrice,
            costPrice: isNaN(parsedCost) ? 0 : parsedCost,
            markup: 0,
            isKit: false,
            composition: [],
            variations: [] // Basic import doesn't handle complex variations yet
          };
        }).filter(p => p.name); // Only import rows with at least a name

        if (newProducts.length > 0) {
          addProducts(newProducts);
          alert(`${newProducts.length} produtos importados com sucesso!`);
        } else {
          alert('Nenhum produto válido encontrado na planilha. Certifique-se de que a coluna "Nome" existe.');
        }
      }
    } catch (error) {
      console.error('Erro ao importar produtos:', error);
      alert('Erro ao importar arquivo. Verifique se é uma planilha válida (.xlsx, .xls, .csv).');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [productToDelete, setProductToDelete] = useState<{id: string, name: string} | null>(null);

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setProductToDelete({ id, name });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-all duration-300">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm">Produtos e Serviços</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Gerencie seu catálogo de produtos e serviços.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-3d pl-10 pr-4 py-2 w-64 bg-slate-50 focus:bg-white transition-all duration-300"
            />
          </div>

          <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/60 shadow-inner gap-1">
            <button 
              onClick={() => handlePrint()}
              className="p-2 rounded-lg transition-all duration-200 text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm"
              title="Imprimir"
            >
              <Printer size={18} />
            </button>
            <div className="w-px h-4 bg-slate-300/50 mx-1"></div>
            <button 
              onClick={handleExportPDF}
              className="p-2 rounded-lg transition-all duration-200 text-slate-500 hover:text-rose-600 hover:bg-white hover:shadow-sm"
              title="Exportar PDF"
            >
              <FileText size={18} />
            </button>
            <button 
              onClick={handleExportExcel}
              className="p-2 rounded-lg transition-all duration-200 text-slate-500 hover:text-emerald-600 hover:bg-white hover:shadow-sm"
              title="Exportar Planilha"
            >
              <Download size={18} />
            </button>
            <div className="w-px h-4 bg-slate-300/50 mx-1"></div>
            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv"
                onChange={handleImportExcel}
                ref={fileInputRef}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Importar Planilha"
              />
              <button 
                className="p-2 rounded-lg transition-all duration-200 text-slate-500 hover:text-blue-600 hover:bg-white hover:shadow-sm"
                title="Importar Planilha"
              >
                <Upload size={18} />
              </button>
            </div>
          </div>

          <button 
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="btn-3d btn-3d-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden lg:inline">Novo Produto</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="card-3d overflow-hidden rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/40 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-200/60 text-slate-600 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Nome / Descrição</th>
                <th className="px-6 py-4">Valor Base</th>
                <th className="px-6 py-4">Variações</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors group odd:bg-white even:bg-slate-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Barcode size={14} className="text-slate-400" />
                      <span className="font-mono text-sm text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{product.code}</span>
                    </div>
                    {product.barcode && (
                      <div className="text-[10px] text-indigo-500 font-mono mt-1 ml-6">EAN: {product.barcode}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <Package size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 flex items-center gap-1">
                            <FileText size={10} />
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit border border-emerald-100 shadow-sm">
                      <DollarSign size={14} />
                      {product.basePrice.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.variations && product.variations.length > 0 ? (
                      <div className="text-xs text-slate-600 space-y-1.5">
                        {product.variations.slice(0, 2).map(v => (
                          <div key={v.id} className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <Tag size={10} className="text-slate-400" />
                            <span className="font-medium">{v.name}:</span>
                            <span className="text-emerald-600 font-bold">R$ {v.price.toFixed(2)}</span>
                            {v.barcode && <span className="text-[9px] text-indigo-400 font-mono ml-auto">EAN: {v.barcode}</span>}
                          </div>
                        ))}
                        {product.variations.length > 2 && (
                          <div className="text-slate-400 italic flex items-center gap-1 pl-1">
                            <Layers size={10} />
                            +{product.variations.length - 2} variações
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="btn-3d btn-3d-secondary px-2 py-1.5"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id, product.name)}
                        className="btn-3d btn-3d-danger px-2 py-1.5"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                        <Package size={24} />
                      </div>
                      <p>Nenhum produto encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }} 
          productToEdit={editingProduct}
        />
      )}

      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border border-white/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 shadow-inner">
                <AlertCircle className="text-rose-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Excluir Produto/Serviço</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Tem certeza que deseja excluir o produto/serviço <strong className="text-slate-800">{productToDelete.name}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn-3d btn-3d-danger px-4 py-2 text-sm"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        <PrintableProducts ref={printRef} products={filteredProducts} companyInfo={companyInfo} />
      </div>
    </div>
  );
}
