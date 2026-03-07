import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useAppContext } from './store';
import { Dashboard } from './components/Dashboard';
import { Sidebar, ViewType } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { ArchivedOrders } from './components/ArchivedOrders';
import { DeletedOrders } from './components/DeletedOrders';
import { FinalizedOrders } from './components/FinalizedOrders';
import { QuotationsView } from './components/QuotationsView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { ReportsView } from './components/ReportsView';
import { EmployeesView } from './components/EmployeesView';
import { CalendarView } from './components/CalendarView';
import { PDVView } from './components/PDVView';
import { FaviconUpdater } from './components/FaviconUpdater';
import { LoginScreen } from './components/LoginScreen';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { DeliveryAlertModal } from './components/DeliveryAlertModal';
import { Employee, Order } from './types';
import { CheckCircle } from 'lucide-react';

function AppContent() {
  const { 
    companyInfo, orders, customers, products, employees, 
    productionStatuses, paymentStatuses, paymentMethods,
    isReady, backupDatabase
  } = useAppContext();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeliveryAlert, setShowDeliveryAlert] = useState(false);
  const [alertOrders, setAlertOrders] = useState<{overdue: Order[], upcoming: Order[]}>({overdue: [], upcoming: []});

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('empresa-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (companyInfo.viewMode === 'tablet' || companyInfo.viewMode === 'mobile') {
      setIsSidebarCollapsed(true);
    } else if (companyInfo.viewMode === 'desktop') {
      setIsSidebarCollapsed(false);
    }
  }, [companyInfo.viewMode]);

  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    const saved = sessionStorage.getItem('empresa-current-user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentUser && !sessionStorage.getItem('delivery-alert-shown')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const overdue: Order[] = [];
      const upcoming: Order[] = [];
      
      orders.forEach(order => {
        if (order.archived || order.deleted || order.finalized || !order.estimatedDeliveryDate) return;
        
        const deliveryDate = new Date(order.estimatedDeliveryDate);
        deliveryDate.setHours(0, 0, 0, 0);
        
        if (deliveryDate < today) {
          overdue.push(order);
        } else {
          const diffTime = deliveryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 3) {
            upcoming.push(order);
          }
        }
      });
      
      if (overdue.length > 0 || upcoming.length > 0) {
        setAlertOrders({overdue, upcoming});
        setShowDeliveryAlert(true);
        sessionStorage.setItem('delivery-alert-shown', 'true');
      }
    }
  }, [currentUser, orders]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!currentUser) return;

      if (e.key === 'F10') {
        e.preventDefault();
        setIsSettingsOpen(true);
      } else if (e.key === 'F12') {
        e.preventDefault();
        setShowLogoutConfirm(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentUser, companyInfo, orders, customers, products, employees, productionStatuses, paymentStatuses, paymentMethods]);

  useEffect(() => {
    localStorage.setItem('empresa-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('empresa-current-user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('empresa-current-user');
    }
  }, [currentUser]);

  useEffect(() => {
    const root = window.document.documentElement;
    const theme = companyInfo.theme || 'auto';

    root.classList.remove('light', 'dark');

    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (companyInfo.theme === 'auto' || !companyInfo.theme) {
          root.classList.remove('light', 'dark');
          root.classList.add(e.matches ? 'dark' : 'light');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      root.classList.add(theme);
    }
  }, [companyInfo.theme]);

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold">Iniciando Banco de Dados SQL...</h2>
        <p className="text-slate-400 mt-2">Por favor, aguarde um momento.</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  const viewModeClass = companyInfo.viewMode === 'desktop' ? 'min-w-[1200px]' : 
                        companyInfo.viewMode === 'tablet' ? 'max-w-[1024px] mx-auto border-x border-slate-200 shadow-2xl' : 
                        companyInfo.viewMode === 'mobile' ? 'max-w-[480px] mx-auto border-x border-slate-200 shadow-2xl' : '';

  return (
    <>
      <FaviconUpdater />
      <div className={`flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden ${viewModeClass} print:block print:h-auto print:overflow-visible print:bg-white`}>
        
        <div className="print:hidden">
          <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            openSettings={() => setIsSettingsOpen(true)} 
            onLogout={() => setShowLogoutConfirm(true)}
            collapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            currentUser={currentUser}
            viewMode={companyInfo.viewMode || 'auto'}
          />
        </div>
        
        <main className="flex-1 overflow-auto print:block print:h-auto print:overflow-visible print:p-0">
          {currentView === 'dashboard' && <Dashboard setCurrentView={setCurrentView} />}
          {currentView === 'archived' && <ArchivedOrders />}
          {currentView === 'deleted' && <DeletedOrders />}
          {currentView === 'finalized' && <FinalizedOrders />}
          {currentView === 'quotations' && <QuotationsView />}
          {currentView === 'customers' && <CustomersView />}
          {currentView === 'products' && <ProductsView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'employees' && <EmployeesView />}
          {currentView === 'pdv' && <PDVView />}
        </main>

        {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} />
        )}

        {showLogoutConfirm && (
          <LogoutConfirmModal 
            onClose={() => setShowLogoutConfirm(false)}
            onLogoutToLogin={() => {
              setCurrentUser(null);
              setShowLogoutConfirm(false);
            }}
            onCloseSystem={() => {
              setShowLogoutConfirm(false);
              // Tenta fechar a aba/janela (pode ser bloqueado pelo navegador se não foi aberta por script)
              window.close();
              // Fallback: redireciona para uma página em branco ou sobre:blank
              if (!window.closed) {
                window.location.href = 'about:blank';
              }
            }}
            backupDatabase={backupDatabase}
          />
        )}

        {showDeliveryAlert && (
          <DeliveryAlertModal 
            onClose={() => setShowDeliveryAlert(false)}
            overdueOrders={alertOrders.overdue}
            upcomingOrders={alertOrders.upcoming}
          />
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
