import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../store';
import { Search, Plus, Edit2, Trash2, Printer, Download, FileText, Upload, AlertCircle, User, Phone, Mail, FileDigit } from 'lucide-react';
import { CustomerModal } from './CustomerModal';
import { PrintableCustomers } from './PrintableCustomers';
import { format } from 'date-fns';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { importFromExcel } from '../utils/importUtils';

export function CustomersView() {
  const { customers, addCustomers, deleteCustomer, companyInfo } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return (customers || []).filter(c => {
      if (!searchLower) return true;
      
      const nameMatch = c.name?.toLowerCase().includes(searchLower);
      const phoneMatch = c.phone?.replace(/\D/g, '').includes(searchLower.replace(/\D/g, ''));
      const emailMatch = c.email?.toLowerCase().includes(searchLower);
      const docMatch = c.document?.replace(/\D/g, '').includes(searchLower.replace(/\D/g, ''));
      
      return nameMatch || phoneMatch || emailMatch || docMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, searchTerm]);

  const handlePrint = () => {
    if (!printRef.current) return;

    const isDirectPrint = companyInfo?.directPrint;
    const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
    const title = `clientes_${dateStr}`;

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
    const data = filteredCustomers.map(c => ({
      Nome: c.name,
      Telefone: c.phone || '-',
      Email: c.email || '-',
      Documento: c.document || '-'
    }));
    const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
    await exportToExcel(data, `clientes_${dateStr}`);
  };

  const handleExportPDF = async () => {
    const headers = ['Nome', 'Telefone', 'Email', 'Documento'];
    const data = filteredCustomers.map(c => [
      c.name,
      c.phone || '-',
      c.email || '-',
      c.document || '-'
    ]);
    const dateStr = format(new Date(), 'dd-MM-yyyy_HH-mm');
    await exportToPDF('Lista de Clientes', headers, data, `clientes_${dateStr}`, companyInfo);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromExcel(file);
      if (data && data.length > 0) {
        const newCustomers = data.map((row: any) => ({
          name: row.Nome || row.name || row.NOME || '',
          phone: row.Telefone || row.telefone || row.phone || row.TELEFONE || '',
          email: row.Email || row.email || row.EMAIL || '',
          document: row.Documento || row.documento || row.document || row.DOCUMENTO || row.CPF || row.CNPJ || ''
        })).filter(c => c.name); // Only import rows with at least a name

        if (newCustomers.length > 0) {
          addCustomers(newCustomers);
          alert(`${newCustomers.length} clientes importados com sucesso!`);
        } else {
          alert('Nenhum cliente válido encontrado na planilha. Certifique-se de que a coluna "Nome" existe.');
        }
      }
    } catch (error) {
      console.error('Erro ao importar clientes:', error);
      alert('Erro ao importar arquivo. Verifique se é uma planilha válida (.xlsx, .xls, .csv).');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [customerToDelete, setCustomerToDelete] = useState<{id: string, name: string} | null>(null);

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setCustomerToDelete({ id, name });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-all duration-300">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm">Clientes</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Gerencie sua base de clientes.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
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
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="btn-3d btn-3d-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden lg:inline">Novo Cliente</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="card-3d overflow-hidden rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/40 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-200/60 text-slate-600 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Documento</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-indigo-50/30 transition-colors group odd:bg-white even:bg-slate-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                        <User size={14} />
                      </div>
                      <span className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      {customer.phone || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      {customer.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <FileDigit size={14} className="text-slate-400" />
                      {customer.document || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsModalOpen(true);
                        }}
                        className="btn-3d btn-3d-secondary px-2 py-1.5"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="btn-3d btn-3d-danger px-2 py-1.5"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                        <User size={24} />
                      </div>
                      <p>Nenhum cliente encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <CustomerModal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }} 
          customerToEdit={editingCustomer}
        />
      )}

      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border border-white/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 shadow-inner">
                <AlertCircle className="text-rose-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Excluir Cliente</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Tem certeza que deseja excluir o cliente <strong className="text-slate-800">{customerToDelete.name}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCustomerToDelete(null)}
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
        <PrintableCustomers ref={printRef} customers={filteredCustomers} companyInfo={companyInfo} />
      </div>
    </div>
  );
}
