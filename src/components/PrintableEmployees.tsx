import React from 'react';
import { CompanyInfo, Employee } from '../types';

interface PrintableEmployeesProps {
  employees: Employee[];
  companyInfo?: CompanyInfo;
}

export const PrintableEmployees = React.forwardRef<HTMLDivElement, PrintableEmployeesProps>(({ employees, companyInfo }, ref) => {
  return (
    <div ref={ref} className="p-4 font-sans text-slate-800 bg-white print:p-2">
      {companyInfo && (
        <div className="flex items-center justify-between mb-3 border-b border-indigo-100 pb-3 print:break-inside-avoid">
          <div className="flex items-center gap-3">
            {companyInfo.logoUrl && (
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-indigo-50 rounded-xl p-1 border border-indigo-100 shadow-sm">
                <img 
                  src={companyInfo.logoUrl} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold uppercase text-indigo-900">{companyInfo.name}</h2>
              <p className="text-[8px] text-slate-600 leading-tight">CNPJ: {companyInfo.cnpj} | Tel: {companyInfo.phone}</p>
              <p className="text-[8px] text-slate-600 leading-tight">{companyInfo.address}</p>
            </div>
          </div>
        </div>
      )}
      <h1 className="text-sm font-bold uppercase text-center mb-3 tracking-widest text-indigo-900 bg-indigo-50 py-1.5 rounded-xl print:break-inside-avoid">LISTA DE FUNCIONÁRIOS</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-indigo-50 text-indigo-900">
            <th className="border-b border-indigo-100 p-1.5 text-left text-[8px] uppercase tracking-wider rounded-tl-xl">Nome</th>
            <th className="border-b border-indigo-100 p-1.5 text-left text-[8px] uppercase tracking-wider rounded-tr-xl">Função</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e, index) => (
            <tr key={e.id} className={`text-[8px] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="border-b border-slate-100 p-1.5 text-slate-800 font-medium">{e.name}</td>
              <td className="border-b border-slate-100 p-1.5 text-slate-600">{e.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 text-center text-[8px] text-slate-400 border-t border-indigo-50 pt-2 print:break-inside-avoid">
        <p className="font-bold text-slate-500 mb-0.5 uppercase">JESUS É BOM, DEUS É FIEL</p>
      </div>
    </div>
  );
});

PrintableEmployees.displayName = 'PrintableEmployees';
