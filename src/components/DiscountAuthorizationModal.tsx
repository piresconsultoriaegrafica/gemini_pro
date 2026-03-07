import React, { useState } from 'react';
import { X, Lock, AlertCircle } from 'lucide-react';
import { useAppContext } from '../store';

interface DiscountAuthorizationModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function DiscountAuthorizationModal({ onSuccess, onCancel }: DiscountAuthorizationModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { employees } = useAppContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if the password matches any employee's password
    const isAuthorized = employees.some(emp => emp.password === password);
    
    if (isAuthorized || password === 'admin') { // Fallback admin password just in case
      onSuccess();
    } else {
      setError('Senha incorreta ou não autorizada.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="window-panel w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="window-header bg-slate-800 text-white">
          <div className="window-title flex items-center gap-2">
            <Lock size={16} />
            Autorização Necessária
          </div>
          <div className="window-controls">
            <button onClick={onCancel} className="window-btn-close hover:bg-rose-500">
              <X size={14} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 bg-slate-50">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Autorizar Desconto</h3>
            <p className="text-sm text-slate-500 mt-1">
              Digite a senha de um funcionário para autorizar este desconto.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="mb-6">
            <input 
              type="password" 
              autoFocus
              required
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError('');
              }}
              className="input-3d w-full px-4 py-3 text-center text-lg tracking-widest"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={onCancel}
              className="btn-3d btn-3d-secondary px-4 py-2 text-sm flex-1"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-3d btn-3d-primary px-4 py-2 text-sm flex-1"
            >
              Autorizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
