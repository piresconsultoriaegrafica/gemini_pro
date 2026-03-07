import React, { useState, useRef } from 'react';
import { useAppContext } from '../store';
import { IconContainer } from './IconContainer';
import { X, Save, Plus, Trash2, Edit2, Check, Download, Upload, AlertCircle, Minus, Square, Maximize2, Settings } from 'lucide-react';
import { CustomOption } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const COLOR_OPTIONS = [
  { value: 'slate', label: 'Cinza', classes: 'bg-slate-100 text-slate-800 border-slate-200 ring-slate-500/20' },
  { value: 'blue', label: 'Azul', classes: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20' },
  { value: 'indigo', label: 'Índigo', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20' },
  { value: 'amber', label: 'Âmbar', classes: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20' },
  { value: 'purple', label: 'Roxo', classes: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20' },
  { value: 'orange', label: 'Laranja', classes: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20' },
  { value: 'emerald', label: 'Esmeralda', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20' },
  { value: 'teal', label: 'Teal', classes: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-500/20' },
  { value: 'rose', label: 'Rosa', classes: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20' },
];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { 
    companyInfo, updateCompanyInfo, 
    productionStatuses, updateProductionStatuses,
    paymentStatuses, updatePaymentStatuses,
    paymentMethods, updatePaymentMethods,
    importState,
    exportDatabaseFile,
    importDatabaseFile
  } = useAppContext();
  
  const [formData, setFormData] = useState(companyInfo);
  
  const [localProdStatuses, setLocalProdStatuses] = useState<CustomOption[]>([...productionStatuses]);
  const [localPayStatuses, setLocalPayStatuses] = useState<CustomOption[]>([...paymentStatuses]);
  const [localPayMethods, setLocalPayMethods] = useState<CustomOption[]>([...paymentMethods]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<File | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateCompanyInfo(formData);
    updateProductionStatuses(localProdStatuses);
    updatePaymentStatuses(localPayStatuses);
    updatePaymentMethods(localPayMethods);
    onClose();
  };

  const handleExportBackup = () => {
    exportDatabaseFile();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);
    if (!file) return;

    // Check extension
    if (!file.name.endsWith('.sqlite') && !file.name.endsWith('.db')) {
      alert('Por favor, selecione um arquivo de banco de dados SQLite (.sqlite ou .db)');
      return;
    }

    setBackupToRestore(file);
    setShowRestoreConfirm(true);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderOptionList = (
    title: string, 
    items: CustomOption[], 
    setItems: React.Dispatch<React.SetStateAction<CustomOption[]>>
  ) => {
    
    const handleAdd = () => {
      setItems([...items, { id: uuidv4(), label: 'Novo Item', color: 'slate' }]);
    };

    const handleUpdate = (id: string, field: keyof CustomOption, value: string) => {
      setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemove = (id: string) => {
      setItems(items.filter(item => item.id !== id));
    };

    return (
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase">{title}</h4>
          <button 
            onClick={handleAdd}
            className="p-1.5 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-md transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <IconContainer size="sm"><Plus size={12} /></IconContainer> Adicionar
          </button>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <input 
                type="text" 
                value={item.label}
                onChange={(e) => handleUpdate(item.id, 'label', e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded outline-none uppercase"
              />
              <select 
                value={item.color}
                onChange={(e) => handleUpdate(item.id, 'color', e.target.value)}
                className={`w-32 px-2 py-1 text-xs rounded border outline-none cursor-pointer ${COLOR_OPTIONS.find(c => c.value === item.color)?.classes}`}
              >
                {COLOR_OPTIONS.map(c => (
                  <option key={c.value} value={c.value} className="bg-white text-slate-800">{c.label}</option>
                ))}
              </select>
              <button 
                onClick={() => handleRemove(item.id)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                title="Remover"
              >
                <IconContainer size="sm"><Trash2 size={12} /></IconContainer>
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-4">Nenhum item configurado.</p>
          )}
        </div>
      </div>
    );
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
              <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
              Configurações do Sistema
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); setIsMinimized(false); }} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                <Square size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 transition-all duration-300 ${isMaximized ? 'p-0' : 'p-4'}`}>
      <div className={`card-3d bg-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl'}`}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/60 bg-slate-50/50 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1.5 rounded-lg text-slate-600">
              <IconContainer size="sm"><Settings size={14} /></IconContainer>
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              Configurações do Sistema
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Minimizar">
              <Minus size={16} />
            </button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title={isMaximized ? "Restaurar" : "Maximizar"}>
              {isMaximized ? <Maximize2 size={16} /> : <Square size={16} />}
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Fechar">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
          
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
              Dados da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Nome da Empresa</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="input-3d w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">CNPJ</label>
                <input 
                  type="text" 
                  value={formData.cnpj} 
                  onChange={e => setFormData({...formData, cnpj: e.target.value})}
                  className="input-3d w-full px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Endereço Completo</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="input-3d w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="input-3d w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">E-mail</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="input-3d w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Instagram</label>
                <input 
                  type="text" 
                  value={formData.instagram || ''} 
                  onChange={e => setFormData({...formData, instagram: e.target.value})}
                  placeholder="@suaempresa"
                  className="input-3d w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Site</label>
                <input 
                  type="text" 
                  value={formData.website || ''} 
                  onChange={e => setFormData({...formData, website: e.target.value})}
                  placeholder="www.suaempresa.com.br"
                  className="input-3d w-full px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Filiais</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newBranch = { id: uuidv4(), name: '', address: '' };
                      setFormData({ ...formData, branches: [...(formData.branches || []), newBranch] });
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Adicionar Filial
                  </button>
                </div>
                <div className="space-y-3">
                  {(formData.branches || []).map((branch, index) => (
                    <div key={branch.id} className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={branch.name}
                          onChange={(e) => {
                            const newBranches = [...(formData.branches || [])];
                            newBranches[index].name = e.target.value;
                            setFormData({ ...formData, branches: newBranches });
                          }}
                          placeholder="Nome da Filial (ex: Loja Centro)"
                          className="input-3d w-full px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={branch.address}
                          onChange={(e) => {
                            const newBranches = [...(formData.branches || [])];
                            newBranches[index].address = e.target.value;
                            setFormData({ ...formData, branches: newBranches });
                          }}
                          placeholder="Endereço completo"
                          className="input-3d w-full px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newBranches = (formData.branches || []).filter(b => b.id !== branch.id);
                          setFormData({ ...formData, branches: newBranches });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-1"
                        title="Remover Filial"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {(!formData.branches || formData.branches.length === 0) && (
                    <p className="text-sm text-slate-400 italic text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">Nenhuma filial cadastrada.</p>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Modo de Visualização do Sistema</label>
                <select
                  value={formData.viewMode || 'auto'}
                  onChange={e => setFormData({...formData, viewMode: e.target.value as any})}
                  className="input-3d w-full px-3 py-2 text-sm"
                >
                  <option value="auto">Automático (Responsivo)</option>
                  <option value="desktop">Forçar Desktop</option>
                  <option value="tablet">Forçar Tablet</option>
                  <option value="mobile">Forçar Celular</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Define como o sistema será exibido. Útil para forçar um layout específico em telas grandes.</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Tema do Sistema</label>
                <select
                  value={formData.theme || 'auto'}
                  onChange={e => setFormData({...formData, theme: e.target.value as any})}
                  className="input-3d w-full px-3 py-2 text-sm"
                >
                  <option value="auto">Automático (Sistema)</option>
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Escolha o tema de cores do sistema.</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Logomarca (Sistema e Relatórios)</label>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 shadow-inner">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">Sem logo</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, logoUrl: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer mb-2"
                    />
                    <p className="text-xs text-slate-400 mb-1 font-medium">Ou insira a URL da imagem:</p>
                    <input 
                      type="url" 
                      value={formData.logoUrl} 
                      onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                      className="input-3d w-full px-3 py-2 text-sm"
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Ícone Central do Login</label>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center shadow-inner">
                    {formData.loginIconUrl ? (
                      <img src={formData.loginIconUrl} alt="Login Icon" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-slate-400 text-xs text-center px-1 font-medium">Padrão</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, loginIconUrl: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer mb-2"
                    />
                    <p className="text-xs text-slate-400 mb-1 font-medium">Ou insira a URL da imagem:</p>
                    <input 
                      type="url" 
                      value={formData.loginIconUrl || ''} 
                      onChange={e => setFormData({...formData, loginIconUrl: e.target.value})}
                      className="input-3d w-full px-3 py-2 text-sm"
                      placeholder="https://exemplo.com/icon.png"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Imagem de Fundo do Login</label>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center shadow-inner">
                    {formData.backgroundImageUrl ? (
                      <img src={formData.backgroundImageUrl} alt="Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-slate-400 text-xs text-center px-1 font-medium">Sem fundo</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, backgroundImageUrl: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer mb-2"
                    />
                    <p className="text-xs text-slate-400 mb-1 font-medium">Ou insira a URL da imagem:</p>
                    <input 
                      type="url" 
                      value={formData.backgroundImageUrl || ''} 
                      onChange={e => setFormData({...formData, backgroundImageUrl: e.target.value})}
                      className="input-3d w-full px-3 py-2 text-sm"
                      placeholder="https://exemplo.com/background.jpg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Informações do Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Desenvolvido por</label>
                <input 
                  type="text" 
                  value={formData.developedBy || ''} 
                  onChange={e => setFormData({...formData, developedBy: e.target.value})}
                  className="input-3d w-full px-3 py-2 text-sm"
                  placeholder="Seu Nome ou Empresa"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Registrado para</label>
                <input 
                  type="text" 
                  value={formData.registeredTo || ''} 
                  onChange={e => setFormData({...formData, registeredTo: e.target.value})}
                  className="input-3d w-full px-3 py-2 text-sm"
                  placeholder="Nome do Cliente"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Versão do Aplicativo</label>
                <input 
                  type="text" 
                  value={formData.appVersion || ''} 
                  onChange={e => setFormData({...formData, appVersion: e.target.value})}
                  className="input-3d w-full px-3 py-2 text-sm"
                  placeholder="1.0.0"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
              Configurações de Impressão
            </h3>
            <p className="text-xs text-slate-500 mb-4">Escolha o tamanho do papel da sua impressora para adequar o layout dos comprovantes.</p>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Tamanho da Bobina / Papel</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                  <input 
                    type="radio" 
                    name="printerPaperSize" 
                    value="standard" 
                    checked={!formData.printerPaperSize || formData.printerPaperSize === 'standard'} 
                    onChange={() => setFormData({...formData, printerPaperSize: 'standard'})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Padrão (A4 / Carta)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                  <input 
                    type="radio" 
                    name="printerPaperSize" 
                    value="80mm" 
                    checked={formData.printerPaperSize === '80mm'} 
                    onChange={() => setFormData({...formData, printerPaperSize: '80mm'})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Bobina 80mm</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                  <input 
                    type="radio" 
                    name="printerPaperSize" 
                    value="50mm" 
                    checked={formData.printerPaperSize === '50mm'} 
                    onChange={() => setFormData({...formData, printerPaperSize: '50mm'})}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Bobina 50mm (58mm)</span>
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.directPrint || false} 
                  onChange={(e) => setFormData({...formData, directPrint: e.target.checked})}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-5 h-5"
                />
                <div>
                  <span className="text-sm font-bold text-slate-700 block">Impressão Direta</span>
                  <span className="text-xs text-slate-500 block">Tenta agilizar a impressão sem preview do navegador (pode não funcionar em todos os navegadores).</span>
                </div>
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
              Personalização de Status e Formas
            </h3>
            <p className="text-xs text-slate-500 mb-4">Adicione, remova ou altere as nomenclaturas e cores das opções disponíveis no sistema.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderOptionList('Status de Produção', localProdStatuses, setLocalProdStatuses)}
              {renderOptionList('Status de Pagamento', localPayStatuses, setLocalPayStatuses)}
              {renderOptionList('Formas de Pagamento', localPayMethods, setLocalPayMethods)}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              Banco de Dados e Backup (SQL)
            </h3>
            <p className="text-xs text-slate-500 mb-4">O sistema utiliza um banco de dados SQLite local. Você pode exportar o arquivo do banco de dados (.sqlite) para backup ou restaurar um banco de dados anterior.</p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleExportBackup}
                className="btn-3d btn-3d-secondary px-4 py-2 text-sm flex items-center gap-2"
              >
                <IconContainer size="sm"><Download size={14} /></IconContainer>
                Exportar Banco de Dados (.sqlite)
              </button>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept=".sqlite,.db"
                  onChange={handleImportBackup}
                  ref={fileInputRef}
                  className="hidden"
                  title="Restaurar Banco de Dados"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-3d btn-3d-primary px-4 py-2 text-sm flex items-center gap-2"
                >
                  <IconContainer size="sm"><Upload size={14} /></IconContainer>
                  Importar Banco de Dados (.sqlite)
                </button>
              </div>
            </div>
          </section>

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
            <IconContainer size="sm"><Save size={14} /></IconContainer>
            Salvar Configurações
          </button>
        </div>
      </div>

      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border border-white/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0 shadow-inner">
                <AlertCircle className="text-rose-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Restaurar Backup</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Atenção: Restaurar um backup irá <strong>substituir TODOS os dados atuais</strong> do sistema. Deseja continuar?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setBackupToRestore(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (backupToRestore) {
                    try {
                      await importDatabaseFile(backupToRestore);
                      alert('Banco de dados restaurado com sucesso!');
                      setShowRestoreConfirm(false);
                      setBackupToRestore(null);
                      onClose();
                    } catch (err) {
                      console.error('Erro ao restaurar banco:', err);
                      alert('Erro ao restaurar o banco de dados. O arquivo pode estar corrompido.');
                    }
                  }
                }}
                className="btn-3d btn-3d-danger px-4 py-2 text-sm"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
