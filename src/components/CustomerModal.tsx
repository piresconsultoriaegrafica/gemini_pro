import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { X, Save, Minus, Square, Maximize2 } from 'lucide-react';
import { Customer } from '../types';

interface CustomerModalProps {
  onClose: () => void;
  onSelect?: (customer: { name: string; phone: string }) => void;
  customerToEdit?: Customer | null;
}

export function CustomerModal({ onClose, onSelect, customerToEdit }: CustomerModalProps) {
  const { addCustomer, updateCustomer } = useAppContext();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setDocument(customerToEdit.document || '');
    }
  }, [customerToEdit]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Nome do cliente é obrigatório');
      return;
    }
    
    const customerData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      document: document.trim(),
    };

    if (customerToEdit) {
      updateCustomer(customerToEdit.id, customerData);
    } else {
      addCustomer(customerData);
    }
    
    if (onSelect) {
      onSelect({ name: name.trim(), phone: phone.trim() });
    }
    
    onClose();
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 w-72 z-[60]">
        <div className="bg-white rounded-t-xl shadow-2xl border border-slate-200 border-b-0 overflow-hidden">
          <div 
            className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors" 
            onClick={() => setIsMinimized(false)}
          >
            <div className="font-bold text-slate-700 text-sm truncate flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              {customerToEdit ? 'Editar Cliente' : 'Cadastrar Cliente'}
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
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-all duration-300 ${isMaximized ? 'p-0' : 'p-4'}`}>
      <div className={`card-3d bg-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-md rounded-2xl shadow-2xl'}`}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/60 bg-slate-50/50 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
              <Maximize2 size={16} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {customerToEdit ? 'Editar Cliente' : 'Cadastrar Cliente'}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMinimized(true)} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" 
              title="Minimizar"
            >
              <Minus size={16} />
            </button>
            <button 
              onClick={() => setIsMaximized(!isMaximized)} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" 
              title={isMaximized ? "Restaurar" : "Maximizar"}
            >
              {isMaximized ? <Maximize2 size={16} /> : <Square size={16} />}
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto bg-slate-50/30">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Nome do Cliente *</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="input-3d w-full px-4 py-2.5 text-sm"
                placeholder="Ex: João Silva"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Telefone</label>
              <input 
                type="text" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                className="input-3d w-full px-4 py-2.5 text-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="input-3d w-full px-4 py-2.5 text-sm"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Documento (CPF/CNPJ)</label>
              <input 
                type="text" 
                value={document} 
                onChange={e => setDocument(e.target.value)}
                className="input-3d w-full px-4 py-2.5 text-sm"
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/50 backdrop-blur-sm flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="btn-3d btn-3d-primary px-6 py-2 text-sm flex items-center gap-2"
          >
            <Save size={18} />
            Salvar Cliente
          </button>
        </div>
      </div>
    </div>
  );
}
