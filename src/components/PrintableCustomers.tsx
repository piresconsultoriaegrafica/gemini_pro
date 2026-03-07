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
      <div ref={ref} className={`font-mono text-black bg-white mx-auto p-2 ${containerClass} leading-tight print:p-0`}>
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
      </div>
    );
  }

  return (
    <div ref={ref} className="p-8 bg-white text-black print:p-0" style={{ fontFamily: 'Arial, sans-serif' }}>
      {companyInfo && (
        <div className="flex items-center justify-between mb-6 border-b border-gray-300 pb-4">
          <div className="flex items-center gap-6">
            {companyInfo.logoUrl && (
              <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center bg-white rounded-lg p-2 border border-gray-100">
                <img 
                  src={companyInfo.logoUrl} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold uppercase">{companyInfo.name}</h2>
              <p className="text-sm text-gray-600">CNPJ: {companyInfo.cnpj} | Tel: {companyInfo.phone}</p>
              <p className="text-sm text-gray-600">{companyInfo.address}</p>
              {companyInfo.branches && companyInfo.branches.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-semibold">Filiais:</p>
                  {companyInfo.branches.map(b => (
                    <p key={b.id}>{b.name}: {b.address}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <h1 className="text-2xl font-black uppercase text-center mb-6 tracking-widest">LISTA DE CLIENTES</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">Nome</th>
            <th className="border border-gray-300 p-2 text-left">Telefone</th>
            <th className="border border-gray-300 p-2 text-left">Email</th>
            <th className="border border-gray-300 p-2 text-left">Documento</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td className="border border-gray-300 p-2">{c.name}</td>
              <td className="border border-gray-300 p-2">{c.phone || '-'}</td>
              <td className="border border-gray-300 p-2">{c.email || '-'}</td>
              <td className="border border-gray-300 p-2">{c.document || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
