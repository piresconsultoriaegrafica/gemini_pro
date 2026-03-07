import React from 'react';
import { Loader2 } from 'lucide-react';

interface BackupProgressModalProps {
  progress: number;
}

export function BackupProgressModal({ progress }: BackupProgressModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Backup em andamento</h2>
        <p className="text-slate-500 mb-6">Aguarde, concluindo o backup do sistema...</p>
        
        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm font-bold text-indigo-600 mt-2">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}
