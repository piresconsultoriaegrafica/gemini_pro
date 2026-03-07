import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Employee } from '../types';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: Employee) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { employees, companyInfo } = useAppContext();
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (selectedUser.password && selectedUser.password !== password) {
      setError('Senha incorreta');
      return;
    }

    onLogin(selectedUser);
  };

  return (
    <div 
      className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden"
      style={companyInfo.backgroundImageUrl ? {
        backgroundImage: `url(${companyInfo.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
    >
      {/* Overlay for background image readability */}
      {companyInfo.backgroundImageUrl && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
      )}

      {/* Abstract Background Shapes (only if no image) */}
      {!companyInfo.backgroundImageUrl && (
        <>
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </>
      )}

      <div className="card-3d bg-white/90 backdrop-blur-xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500 border border-white/50">
        <div className="p-8 text-center border-b border-slate-200/60 bg-white/50">
          {companyInfo.logoUrl ? (
            <img 
              src={companyInfo.logoUrl} 
              alt={companyInfo.name} 
              className="h-24 mx-auto mb-4 object-contain drop-shadow-md"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
              {companyInfo.loginIconUrl ? (
                <img src={companyInfo.loginIconUrl} alt="Icon" className="h-12 w-12 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <ShieldCheck className="h-10 w-10 text-white" />
              )}
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">{companyInfo.name || 'Sistema de Gestão'}</h1>
          <p className="text-slate-500 text-sm font-medium">Bem-vindo de volta! Faça login para continuar.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {!selectedUser ? (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                  Selecione seu usuário
                </label>
                <div className="grid gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {employees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => setSelectedUser(employee)}
                      className="flex items-center p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group text-left relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 group-hover:via-indigo-500/10 transition-all duration-500"></div>
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-inner">
                        <User size={20} />
                      </div>
                      <div className="ml-3 relative z-10">
                        <p className="font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">{employee.name}</p>
                        <p className="text-xs text-slate-500 group-hover:text-indigo-500 capitalize font-medium">{employee.role}</p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="flex items-center p-3 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-md">
                    <User size={20} />
                  </div>
                  <div className="ml-3">
                    <p className="font-bold text-slate-800">{selectedUser.name}</p>
                    <p className="text-xs text-indigo-600 capitalize font-medium">{selectedUser.role}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setPassword('');
                      setError('');
                    }}
                    className="ml-auto text-xs font-bold text-slate-400 hover:text-indigo-600 hover:underline transition-colors"
                  >
                    Trocar
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Senha de Acesso
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className="input-3d w-full pl-10 pr-4 py-3 text-sm transition-all"
                      placeholder="Digite sua senha"
                      autoFocus
                    />
                  </div>
                  {error && (
                    <div className="mt-3 p-2 rounded-lg bg-rose-50 border border-rose-100 flex items-center animate-in fade-in slide-in-from-top-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 ml-1" />
                      <p className="text-xs font-medium text-rose-600">{error}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-3d btn-3d-primary w-full py-3 text-sm font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                >
                  Entrar no Sistema
                </button>
              </div>
            )}
          </form>
        </div>
        
        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-200/60 text-center backdrop-blur-sm">
          <p className="text-xs text-slate-400 font-medium">
            {companyInfo.developedBy ? `Desenvolvido por ${companyInfo.developedBy}` : 'Sistema de Gestão'} 
            {companyInfo.appVersion && ` • v${companyInfo.appVersion}`}
          </p>
        </div>
      </div>
    </div>
  );
}
