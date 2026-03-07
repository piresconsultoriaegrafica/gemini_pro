import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../store';
import { Search, Plus, Edit2, Trash2, Eye, EyeOff, Shield, X, AlertCircle, Minus, Square, Maximize2, Printer } from 'lucide-react';
import { Employee } from '../types';
import { PrintableEmployees } from './PrintableEmployees';

export function EmployeesView() {
  const { employees, deleteEmployee, addEmployee, updateEmployee, companyInfo } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = printRef.current.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Lista de Funcionários</title>
          ${styles}
          <style>
            @media print {
              @page { size: A4; margin: 10mm; }
              body { margin: 0; padding: 0; }
              .print-container { width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${content}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredEmployees = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return (employees || []).filter(e => {
      if (!searchLower) return true;
      
      const nameMatch = e.name?.toLowerCase().includes(searchLower);
      const roleMatch = e.role?.toLowerCase().includes(searchLower);
      
      return nameMatch || roleMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm]);

  const [employeeToDelete, setEmployeeToDelete] = useState<{id: string, name: string} | null>(null);

  const handleDeleteConfirm = () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setEmployeeToDelete({ id, name });
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-8 py-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Funcionários</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie os acessos ao sistema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="btn-3d btn-3d-secondary px-4 py-2 text-sm flex items-center gap-2"
          >
            <Printer size={16} />
            Imprimir A4
          </button>
          <button 
            onClick={() => {
              setEditingEmployee(null);
              setIsModalOpen(true);
            }}
            className="btn-3d btn-3d-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Funcionário
          </button>
        </div>
      </div>

      <div className="p-8 flex-1 overflow-hidden flex flex-col">
        <div className="mb-6 flex items-center gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou função..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-3d w-full pl-10 pr-4 py-2"
            />
          </div>
        </div>

        <div className="card-3d flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Função</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(employee => (
                  <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Shield size={12} />
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(employee)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(employee.id, employee.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Nenhum funcionário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <EmployeeModal 
          employee={editingEmployee}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            if (editingEmployee) {
              updateEmployee(editingEmployee.id, data);
            } else {
              addEmployee(data as Omit<Employee, 'id'>);
            }
            setIsModalOpen(false);
          }}
        />
      )}

      {employeeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="window-panel max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="text-rose-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Excluir Funcionário</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Tem certeza que deseja excluir o funcionário <strong>{employeeToDelete.name}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEmployeeToDelete(null)}
                className="btn-3d btn-3d-secondary px-4 py-2 text-sm"
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

      {/* Hidden printable content */}
      <div className="hidden">
        <PrintableEmployees
          ref={printRef}
          employees={filteredEmployees}
          companyInfo={companyInfo}
        />
      </div>
    </div>
  );
}

function EmployeeModal({ 
  employee, 
  onClose, 
  onSave 
}: { 
  employee: Employee | null, 
  onClose: () => void,
  onSave: (data: Partial<Employee>) => void 
}) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    password: employee?.password || '',
    role: employee?.role || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
              {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
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
    <div className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300 ${isMaximized ? 'p-0' : 'p-4'}`}>
      <div className={`card-3d bg-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-md rounded-2xl shadow-2xl'}`}>
        <div className="px-5 py-4 border-b border-slate-200/60 bg-slate-50/50 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
              <Shield size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
          </div>
          <div className="flex items-center gap-1">
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
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="input-3d w-full px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="input-3d w-full px-3 py-2 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Função</label>
            <input 
              type="text" 
              required
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
              className="input-3d w-full px-3 py-2"
              placeholder="Ex: Atendente, Designer, Gerente"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="btn-3d btn-3d-secondary px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-3d btn-3d-primary px-6 py-2 text-sm"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
