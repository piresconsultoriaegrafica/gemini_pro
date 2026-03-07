import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import { Search, Plus, Edit2, Trash2, Eye, EyeOff, Shield, X, AlertCircle } from 'lucide-react';
import { Employee } from '../types';

export function EmployeesView() {
  const { employees, deleteEmployee, addEmployee, updateEmployee } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="window-panel w-full max-w-md overflow-hidden">
        <div className="window-header">
          <div className="window-title">
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </div>
          <div className="window-controls">
            <button onClick={onClose} className="window-btn-close">
              <X size={14} />
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
