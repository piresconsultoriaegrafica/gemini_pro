import React from 'react';
import { Icon3D } from './Icon3D';

interface LogoutConfirmModalProps {
  onClose: () => void;
  onLogoutToLogin: () => void;
  onCloseSystem: () => void;
}

export function LogoutConfirmModal({ onClose, onLogoutToLogin, onCloseSystem }: LogoutConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card-3d bg-white w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50">
        <div className="p-6 text-center">
          <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Icon3D name="sign-out" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Deseja sair do sistema?</h2>
          <p className="text-slate-500 mb-6 text-sm">
            Escolha uma das opções abaixo para continuar.
          </p>

          <div className="space-y-3">
            <button
              onClick={onLogoutToLogin}
              className="w-full flex items-center justify-center p-4 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-700 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="bg-indigo-200 p-2 rounded-lg mr-4 group-hover:bg-indigo-300 transition-colors">
                <Icon3D name="sign-out" size={20} />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-indigo-800">Trocar de Usuário</div>
                <div className="text-xs text-indigo-600/80">Voltar para a tela de login</div>
              </div>
            </button>

            <button
              onClick={onCloseSystem}
              className="w-full flex items-center justify-center p-4 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:border-rose-200 text-rose-700 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="bg-rose-200 p-2 rounded-lg mr-4 group-hover:bg-rose-300 transition-colors">
                <Icon3D name="power-off" size={20} />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-rose-800">Fechar Sistema</div>
                <div className="text-xs text-rose-600/80">Encerrar a aplicação</div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-slate-50/50 p-4 flex justify-center border-t border-slate-200/60 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Icon3D name="close" size={16} className="mr-2" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
