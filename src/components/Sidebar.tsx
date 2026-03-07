import React from 'react';
import { useAppContext } from '../store';
import { LayoutDashboard, Archive, Settings, Printer, Trash2, CheckCircle, Users, Package, BarChart2, ChevronLeft, ChevronRight, ChevronDown, LogOut, Calendar, User, ClipboardList } from 'lucide-react';
import { Employee } from '../types';

export type ViewType = 'dashboard' | 'archived' | 'deleted' | 'finalized' | 'quotations' | 'customers' | 'products' | 'reports' | 'calendar' | 'employees';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  openSettings: () => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
  currentUser: Employee;
  viewMode: 'auto' | 'desktop' | 'tablet' | 'mobile';
}

export function Sidebar({ currentView, setCurrentView, openSettings, onLogout, collapsed, onToggle, currentUser, viewMode }: SidebarProps) {
  const { companyInfo } = useAppContext();
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);

  const isTouchDevice = viewMode === 'tablet' || viewMode === 'mobile';

  const handleMenuClick = (menuName: string, defaultView: ViewType) => {
    if (openMenu === menuName) {
      setOpenMenu(null);
    } else {
      setOpenMenu(menuName);
    }
  };

  const handleSubMenuClick = (view: ViewType) => {
    setCurrentView(view);
  };

  const NavItem = ({ 
    active, 
    onClick, 
    icon: Icon, 
    label, 
    collapsed,
    hasSubmenu = false,
    isOpen = false
  }: { 
    active: boolean; 
    onClick: () => void; 
    icon: any; 
    label: string; 
    collapsed: boolean;
    hasSubmenu?: boolean;
    isOpen?: boolean;
  }) => (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
        active 
          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)] translate-y-[-1px]' 
          : 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)]'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'} z-10`}>
        <div className={`p-1.5 rounded-lg transition-all duration-300 ${active ? 'bg-white/20 shadow-inner' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
          <Icon size={18} className={active ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'} />
        </div>
        {!collapsed && <span>{label}</span>}
      </div>
      {!collapsed && hasSubmenu && (
        <ChevronDown size={14} className={`z-10 transition-transform duration-300 ${active ? 'text-indigo-100' : 'text-slate-400'} ${isOpen ? 'rotate-180' : ''}`} />
      )}
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-600 opacity-100 z-0" />
      )}
    </button>
  );

  const SubMenuItem = ({ 
    active, 
    onClick, 
    icon: Icon, 
    label, 
    colorClass,
    bgClass,
    collapsed 
  }: { 
    active: boolean; 
    onClick: () => void; 
    icon: any; 
    label: string; 
    colorClass: string;
    bgClass: string;
    collapsed: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`w-full text-left ${collapsed ? 'px-4 py-2 hover:bg-slate-50' : 'px-3 py-2 rounded-lg hover:bg-slate-50'} text-sm flex items-center gap-3 transition-all duration-200 ${active ? `${colorClass} font-medium ${bgClass} shadow-sm` : 'text-slate-600'}`}
    >
      {collapsed ? <Icon size={16} /> : (
        <div className={`w-2 h-2 rounded-full shadow-sm ${active ? colorClass.replace('text-', 'bg-') : 'bg-slate-300'}`} />
      )}
      <span>{label}</span>
    </button>
  );

  return (
    <aside className={`${collapsed ? 'w-24' : 'w-72'} bg-slate-50/80 backdrop-blur-xl border-r border-white/50 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 transition-all duration-300 relative`}>
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-8 bg-white border border-slate-100 rounded-full p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all duration-300 z-30"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-6 mb-2 flex flex-col items-center text-center ${collapsed ? 'px-2' : ''}`}>
        <div className={`${collapsed ? 'w-12 h-12' : 'w-24 h-24'} rounded-2xl overflow-hidden mb-5 shadow-[0_8px_20px_rgba(0,0,0,0.08),inset_0_2px_0_rgba(255,255,255,0.5)] bg-gradient-to-br from-white to-slate-100 border border-white transition-all duration-500 group hover:scale-105 hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]`}>
          {companyInfo.logoUrl ? (
            <img 
              src={companyInfo.logoUrl} 
              alt={companyInfo.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 group-hover:text-indigo-400 transition-colors">
              <Printer size={collapsed ? 24 : 40} />
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="flex flex-col items-center w-full animate-fade-in-down">
            <h1 className="font-bold text-lg text-slate-800 leading-tight tracking-tight">{companyInfo.name}</h1>
            <div className="mt-3 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">{companyInfo.cnpj}</p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide pb-4">
        <NavItem 
          active={currentView === 'dashboard'} 
          onClick={() => setCurrentView('dashboard')} 
          icon={LayoutDashboard} 
          label="Painel" 
          collapsed={collapsed} 
        />

        <div className="relative group/menu">
          <NavItem 
            active={['finalized', 'archived', 'deleted', 'quotations'].includes(currentView)} 
            onClick={() => handleMenuClick('pedidos', 'finalized')} 
            icon={ClipboardList} 
            label="Pedidos" 
            collapsed={collapsed}
            hasSubmenu
            isOpen={openMenu === 'pedidos'}
          />
          
          <div className={`${openMenu === 'pedidos' ? 'block' : 'hidden'} overflow-hidden transition-all duration-300 ${collapsed ? 'absolute left-full top-0 ml-4 w-56 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-white/50 p-2' : 'mt-2 space-y-1 pl-4'}`}>
            {collapsed && (
              <div className="px-3 py-2 mb-1 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gestão de Pedidos</span>
              </div>
            )}
            <SubMenuItem 
              active={currentView === 'quotations'} 
              onClick={() => handleSubMenuClick('quotations')} 
              icon={ClipboardList} 
              label="Cotações" 
              colorClass="text-amber-600" 
              bgClass="bg-amber-50" 
              collapsed={collapsed} 
            />
            <SubMenuItem 
              active={currentView === 'finalized'} 
              onClick={() => handleSubMenuClick('finalized')} 
              icon={CheckCircle} 
              label="Finalizados" 
              colorClass="text-emerald-600" 
              bgClass="bg-emerald-50" 
              collapsed={collapsed} 
            />
            <SubMenuItem 
              active={currentView === 'archived'} 
              onClick={() => handleSubMenuClick('archived')} 
              icon={Archive} 
              label="Cancelados" 
              colorClass="text-indigo-600" 
              bgClass="bg-indigo-50" 
              collapsed={collapsed} 
            />
            <SubMenuItem 
              active={currentView === 'deleted'} 
              onClick={() => handleSubMenuClick('deleted')} 
              icon={Trash2} 
              label="Excluídos" 
              colorClass="text-rose-600" 
              bgClass="bg-rose-50" 
              collapsed={collapsed} 
            />
          </div>
        </div>

        <div className="relative group/menu">
          <NavItem 
            active={['reports', 'customers', 'products', 'employees'].includes(currentView)} 
            onClick={() => handleMenuClick('relatorios', 'reports')} 
            icon={BarChart2} 
            label="Gestão" 
            collapsed={collapsed}
            hasSubmenu
            isOpen={openMenu === 'relatorios'}
          />
          
          <div className={`${openMenu === 'relatorios' ? 'block' : 'hidden'} overflow-hidden transition-all duration-300 ${collapsed ? 'absolute left-full top-0 ml-4 w-56 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-white/50 p-2' : 'mt-2 space-y-1 pl-4'}`}>
            {collapsed && (
              <div className="px-3 py-2 mb-1 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Relatórios e Cadastros</span>
              </div>
            )}
            <SubMenuItem 
              active={currentView === 'reports'} 
              onClick={() => handleSubMenuClick('reports')} 
              icon={BarChart2} 
              label="Visão Geral" 
              colorClass="text-indigo-600" 
              bgClass="bg-indigo-50" 
              collapsed={collapsed} 
            />
            <SubMenuItem 
              active={currentView === 'customers'} 
              onClick={() => handleSubMenuClick('customers')} 
              icon={Users} 
              label="Clientes" 
              colorClass="text-blue-600" 
              bgClass="bg-blue-50" 
              collapsed={collapsed} 
            />
            <SubMenuItem 
              active={currentView === 'products'} 
              onClick={() => handleSubMenuClick('products')} 
              icon={Package} 
              label="Produtos" 
              colorClass="text-purple-600" 
              bgClass="bg-purple-50" 
              collapsed={collapsed} 
            />
            <SubMenuItem 
              active={currentView === 'employees'} 
              onClick={() => handleSubMenuClick('employees')} 
              icon={Users} 
              label="Equipe" 
              colorClass="text-teal-600" 
              bgClass="bg-teal-50" 
              collapsed={collapsed} 
            />
          </div>
        </div>

        <NavItem 
          active={currentView === 'calendar'} 
          onClick={() => setCurrentView('calendar')} 
          icon={Calendar} 
          label="Calendário" 
          collapsed={collapsed} 
        />
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-3 bg-white/50 backdrop-blur-sm">
        <button
          onClick={openSettings}
          title={collapsed ? "Configurações (F10)" : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] transition-all duration-200 group`}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-50 transition-colors">
              <Settings size={16} className="text-slate-500 group-hover:text-indigo-600" />
            </div>
            {!collapsed && <span>Configurações</span>}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F10</span>
          )}
        </button>
        
        <button
          onClick={onLogout}
          title={collapsed ? "Sair (F12)" : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-white hover:text-rose-600 hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] transition-all duration-200 group`}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-rose-50 transition-colors">
              <LogOut size={16} className="text-slate-500 group-hover:text-rose-600" />
            </div>
            {!collapsed && <span>Sair</span>}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-bold text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">F12</span>
          )}
        </button>

        {!collapsed && (
          <div className="pt-4 mt-2 border-t border-slate-200/50 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-600">{currentUser.name}</span>
            </div>
            
            <div className="flex flex-col items-center text-[9px] text-slate-400 font-medium uppercase tracking-widest space-y-1 opacity-60 hover:opacity-100 transition-opacity">
              {companyInfo.appVersion && <span>v{companyInfo.appVersion}</span>}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
