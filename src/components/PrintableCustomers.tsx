import React from 'react';
import { CompanyInfo } from '../types';

interface PrintableCustomersProps {
  customers: any[];
  companyInfo?: CompanyInfo;
}

export const PrintableCustomers = React.forwardRef<HTMLDivElement, PrintableCustomersProps>(({ customers, companyInfo }, ref) => {
  const paperSize = companyInfo?.printerPaperSize || 'standard';

  if (paperSize === '80mm' || paperSize === '50mm') {
    const is50mm = paperSize === '50mm';
    const containerClass = is50mm ? 'w-[188px] text-[10px]' : 'w-[300px] text-[12px]';
    const titleClass = is50mm ? 'text-sm' : 'text-base';
    
    return (
      <div ref={ref} className={`font-mono text-black bg-white mx-auto p-2 ${containerClass} leading-tight print:p-4`}>
        <div className="text-center mb-3 border-b border-black pb-2 border-dashed">
          {companyInfo && (
            <>
              {companyInfo.logoUrl && (
                <div className="flex justify-center mb-2">
                  <img 
                    src={companyInfo.logoUrl} 
                    alt="Logo" 
                    className={is50mm ? 'max-w-[100px] max-h-[100px] object-contain' : 'max-w-[150px] max-h-[150px] object-contain'}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <h1 className={`font-bold uppercase ${titleClass}`}>{companyInfo.name}</h1>
              <p className={is50mm ? 'text-[10px]' : 'text-xs'}>{companyInfo.phone}</p>
              <div className="my-2 border-t border-black border-dashed"></div>
            </>
          )}
          <h2 className={`font-bold uppercase ${titleClass}`}>LISTA DE CLIENTES</h2>
          <p>Total: {customers.length}</p>
        </div>
        
        {customers.map(c => (
          <div key={c.id} className="mb-3 border-b border-black pb-2 border-dashed">
            <p className="font-bold">{c.name}</p>
            {c.phone && <p>TEL: {c.phone}</p>}
            {c.email && <p>EMAIL: {c.email}</p>}
            {c.document && <p>DOC: {c.document}</p>}
          </div>
        ))}
        <div className="text-center mt-4 pt-2 border-t border-black border-dashed">
          <p className="font-bold">JESUS É BOM, DEUS É FIEL</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="p-8 font-sans text-slate-800 bg-white print:p-4">
      {companyInfo && (
        <div className="flex items-center justify-between mb-6 border-b border-indigo-100 pb-6">
          <div className="flex items-center gap-6">
            {companyInfo.logoUrl && (
              <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-indigo-50 rounded-2xl p-2 border border-indigo-100 shadow-sm">
                <img 
                  src={companyInfo.logoUrl} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold uppercase text-indigo-900">{companyInfo.name}</h2>
              <p className="text-xs text-slate-600">CNPJ: {companyInfo.cnpj} | Tel: {companyInfo.phone}</p>
              <p className="text-xs text-slate-600">{companyInfo.address}</p>
              {companyInfo.branches && companyInfo.branches.length > 0 && (
                <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Filiais:</p>
                  {companyInfo.branches.map(b => (
                    <p key={b.id} className="text-[10px] text-slate-600">{b.name}: {b.address}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <h1 className="text-xl font-bold uppercase text-center mb-6 tracking-widest text-indigo-900 bg-indigo-50 py-3 rounded-2xl">LISTA DE CLIENTES</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-indigo-50 text-indigo-900">
            <th className="border-b border-indigo-100 p-3 text-left text-[10px] uppercase tracking-wider rounded-tl-2xl">Nome</th>
            <th className="border-b border-indigo-100 p-3 text-left text-[10px] uppercase tracking-wider">Telefone</th>
            <th className="border-b border-indigo-100 p-3 text-left text-[10px] uppercase tracking-wider">Email</th>
            <th className="border-b border-indigo-100 p-3 text-left text-[10px] uppercase tracking-wider rounded-tr-2xl">Documento</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, index) => (
            <tr key={c.id} className={`text-xs ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="border-b border-slate-100 p-3 text-slate-800 font-medium">{c.name}</td>
              <td className="border-b border-slate-100 p-3 text-slate-600">{c.phone || '-'}</td>
              <td className="border-b border-slate-100 p-3 text-slate-600">{c.email || '-'}</td>
              <td className="border-b border-slate-100 p-3 text-slate-600">{c.document || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-12 text-center text-[10px] text-slate-400 border-t border-indigo-50 pt-4">
        <p className="font-bold text-slate-500 mb-1">JESUS É BOM, DEUS É FIEL</p>
      </div>
    </div>
  );
});

PrintableCustomers.displayName = 'PrintableCustomers';
