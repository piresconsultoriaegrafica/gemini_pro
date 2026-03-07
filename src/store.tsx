import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, CompanyInfo, Order, Customer, CustomOption, Product, Employee, Role } from './types';
import { v4 as uuidv4 } from 'uuid';
import { initDB, getAppState, saveAppState, importDatabase, exportDatabase } from './services/sqliteService';

const defaultCompanyInfo: CompanyInfo = {
  name: 'Minha Empresa',
  cnpj: '00.000.000/0000-00',
  address: 'Rua Exemplo, 123 - Centro',
  phone: '(00) 00000-0000',
  email: 'contato@minhaempresa.com.br',
  logoUrl: 'https://picsum.photos/seed/empresa/200/200?blur=1',
  printerPaperSize: 'standard',
  developedBy: 'Seu Nome ou Empresa',
  registeredTo: 'Minha Empresa',
  appVersion: '1.0.0',
};

export const DEFAULT_ROLES: Role[] = [
  { id: 'admin', name: 'Administrador', level: 0, permissions: [] },
  { id: 'manager', name: 'Gerente', level: 1, permissions: ['manage_orders', 'manage_customers', 'view_reports'] },
  { id: 'employee', name: 'Funcionário', level: 2, permissions: ['view_orders', 'update_order_status'] },
];

export const DEFAULT_PRODUCTION_STATUSES: CustomOption[] = [
  { id: '1', label: 'fila', color: 'slate' },
  { id: '2', label: 'criação', color: 'blue' },
  { id: '3', label: 'montagem', color: 'indigo' },
  { id: '4', label: 'ajuste', color: 'amber' },
  { id: '5', label: 'em fase de impressão', color: 'purple' },
  { id: '6', label: 'em produção externa', color: 'orange' },
  { id: '7', label: 'pronto para retirada', color: 'emerald' },
  { id: '8', label: 'entregue', color: 'teal' },
];

export const DEFAULT_PAYMENT_STATUSES: CustomOption[] = [
  { id: '1', label: 'pendente', color: 'rose' },
  { id: '2', label: 'parcial', color: 'amber' },
  { id: '3', label: 'pago', color: 'emerald' },
];

export const DEFAULT_PAYMENT_METHODS: CustomOption[] = [
  { id: '1', label: 'pix', color: 'teal' },
  { id: '2', label: 'espécie', color: 'emerald' },
  { id: '3', label: 'cartão de crédito', color: 'blue' },
  { id: '4', label: 'cartão de débito', color: 'indigo' },
  { id: '5', label: 'link de pagamento', color: 'purple' },
];

const defaultState: AppState = {
  companyInfo: defaultCompanyInfo,
  orders: [],
  customers: [],
  products: [],
  employees: [{ id: 'admin', name: 'Administrador', login: 'admin', password: '123', role: 'admin' }],
  roles: DEFAULT_ROLES,
  productionStatuses: DEFAULT_PRODUCTION_STATUSES,
  paymentStatuses: DEFAULT_PAYMENT_STATUSES,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
};

interface AppContextType extends AppState {
  isReady: boolean;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => void;
  addOrder: (order: Omit<Order, 'id' | 'queueNumber' | 'createdAt' | 'archived'>) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  archiveOrder: (id: string, reason: string) => void;
  unarchiveOrder: (id: string) => void;
  deleteOrder: (id: string, reason?: string) => void;
  finalizeOrder: (id: string, totalAmount: number) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  addCustomers: (customers: Omit<Customer, 'id'>[]) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addProducts: (products: Omit<Product, 'id'>[]) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  updateProductionStatuses: (statuses: CustomOption[]) => void;
  updatePaymentStatuses: (statuses: CustomOption[]) => void;
  updatePaymentMethods: (methods: CustomOption[]) => void;
  importState: (newState: AppState) => void;
  exportDatabaseFile: () => void;
  importDatabaseFile: (file: File) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      await initDB();
      const savedState = await getAppState();
      if (savedState && savedState.companyInfo) {
        setState({
          ...defaultState,
          ...savedState,
          roles: (savedState.roles && savedState.roles.length > 0) ? savedState.roles : DEFAULT_ROLES,
          productionStatuses: (savedState.productionStatuses && savedState.productionStatuses.length > 0) ? savedState.productionStatuses : DEFAULT_PRODUCTION_STATUSES,
          paymentStatuses: (savedState.paymentStatuses && savedState.paymentStatuses.length > 0) ? savedState.paymentStatuses : DEFAULT_PAYMENT_STATUSES,
          paymentMethods: (savedState.paymentMethods && savedState.paymentMethods.length > 0) ? savedState.paymentMethods : DEFAULT_PAYMENT_METHODS,
        });
      } else {
        // First time, save default state to DB
        await saveAppState(defaultState);
      }
      setIsReady(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (isReady) {
      saveAppState(state);
    }
  }, [state, isReady]);

  const importState = (newState: AppState) => {
    setState({
      ...defaultState,
      ...newState,
      roles: newState.roles || DEFAULT_ROLES,
      productionStatuses: newState.productionStatuses || DEFAULT_PRODUCTION_STATUSES,
      paymentStatuses: newState.paymentStatuses || DEFAULT_PAYMENT_STATUSES,
      paymentMethods: newState.paymentMethods || DEFAULT_PAYMENT_METHODS,
    });
  };

  const exportDatabaseFile = async () => {
    const blob = await exportDatabase();
    if (!blob) return;

    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
    const fileName = `backup_sistema_${dateStr}.sqlite`;

    // Tentar usar a API de Acesso ao Sistema de Arquivos (File System Access API)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Banco de Dados SQLite',
            accept: { 'application/x-sqlite3': ['.sqlite', '.db'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err) {
        // Se o usuário cancelar ou ocorrer erro, prosseguir com o download padrão
        console.warn("File System Access API não utilizada ou cancelada, usando fallback:", err);
      }
    }

    // Fallback: Download tradicional
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importDatabaseFile = async (file: File) => {
    console.log("Importing database file:", file.name);
    try {
      await importDatabase(file);
      console.log("Database imported successfully");
      const newState = await getAppState();
      if (newState) {
        importState(newState);
      }
    } catch (err) {
      console.error("Error in importDatabaseFile:", err);
      throw err;
    }
  };

  const updateCompanyInfo = (info: Partial<CompanyInfo>) => {
    setState((prev) => ({
      ...prev,
      companyInfo: { ...prev.companyInfo, ...info },
    }));
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'queueNumber' | 'createdAt' | 'archived'>) => {
    setState((prev) => {
      const queueNumber = prev.orders.length > 0 
        ? Math.max(...prev.orders.map(o => o.queueNumber)) + 1 
        : 1;
      
      const newOrder: Order = {
        ...orderData,
        id: uuidv4(),
        queueNumber,
        createdAt: new Date().toISOString(),
        archived: false,
      };
      return { ...prev, orders: [...prev.orders, newOrder] };
    });
  };

  const updateOrder = (id: string, orderData: Partial<Order>) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, ...orderData } : o)),
    }));
  };

  const archiveOrder = (id: string, reason: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => 
        o.id === id ? { ...o, archived: true, archiveReason: reason, status: 'cancelado' } : o
      ),
    }));
  };

  const unarchiveOrder = (id: string) => {
    setState((prev) => {
      const queueNumber = prev.orders.length > 0 
        ? Math.max(...prev.orders.map(o => o.queueNumber)) + 1 
        : 1;

      const firstStatus = prev.productionStatuses[0]?.label || 'fila';

      return {
        ...prev,
        orders: prev.orders.map((o) => 
          o.id === id ? { ...o, archived: false, archiveReason: undefined, status: firstStatus, queueNumber, createdAt: new Date().toISOString() } : o
        ),
      };
    });
  };

  const deleteOrder = (id: string, reason?: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => 
        o.id === id ? { ...o, deleted: true, archiveReason: reason ? `Excluído: ${reason}` : o.archiveReason } : o
      ),
    }));
  };

  const finalizeOrder = (id: string, totalAmount: number) => {
    setState((prev) => {
      const lastProdStatus = prev.productionStatuses[prev.productionStatuses.length - 1]?.label || 'entregue';
      const lastPayStatus = prev.paymentStatuses[prev.paymentStatuses.length - 1]?.label || 'pago';
      
      return {
        ...prev,
        orders: prev.orders.map((o) => 
          o.id === id ? { 
            ...o, 
            finalized: true, 
            status: lastProdStatus, 
            paymentStatus: lastPayStatus,
            amountPaid: totalAmount
          } : o
        ),
      };
    });
  };

  const addCustomer = (customerData: Omit<Customer, 'id'>) => {
    setState((prev) => {
      const newCustomer: Customer = {
        ...customerData,
        id: uuidv4(),
      };
      return { ...prev, customers: [...(prev.customers || []), newCustomer] };
    });
  };

  const addCustomers = (customersData: Omit<Customer, 'id'>[]) => {
    setState((prev) => {
      const newCustomers: Customer[] = customersData.map(c => ({
        ...c,
        id: uuidv4(),
      }));
      return { ...prev, customers: [...(prev.customers || []), ...newCustomers] };
    });
  };

  const updateCustomer = (id: string, customerData: Partial<Customer>) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === id ? { ...c, ...customerData } : c)),
    }));
  };

  const deleteCustomer = (id: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
  };

  const addProduct = (productData: Omit<Product, 'id'>) => {
    setState((prev) => {
      const newProduct: Product = {
        ...productData,
        id: uuidv4(),
      };
      return { ...prev, products: [...(prev.products || []), newProduct] };
    });
  };

  const addProducts = (productsData: Omit<Product, 'id'>[]) => {
    setState((prev) => {
      const newProducts: Product[] = productsData.map(p => ({
        ...p,
        id: uuidv4(),
      }));
      return { ...prev, products: [...(prev.products || []), ...newProducts] };
    });
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...productData } : p)),
    }));
  };

  const deleteProduct = (id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    setState((prev) => {
      const newEmployee: Employee = {
        ...employeeData,
        id: uuidv4(),
      };
      return { ...prev, employees: [...(prev.employees || []), newEmployee] };
    });
  };

  const updateEmployee = (id: string, employeeData: Partial<Employee>) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === id ? { ...e, ...employeeData } : e)),
    }));
  };

  const deleteEmployee = (id: string) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== id),
    }));
  };

  const updateProductionStatuses = (statuses: CustomOption[]) => {
    setState((prev) => ({ ...prev, productionStatuses: statuses }));
  };

  const updatePaymentStatuses = (statuses: CustomOption[]) => {
    setState((prev) => ({ ...prev, paymentStatuses: statuses }));
  };

  const updatePaymentMethods = (methods: CustomOption[]) => {
    setState((prev) => ({ ...prev, paymentMethods: methods }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        isReady,
        updateCompanyInfo,
        addOrder,
        updateOrder,
        archiveOrder,
        unarchiveOrder,
        deleteOrder,
        finalizeOrder,
        addCustomer,
        addCustomers,
        updateCustomer,
        deleteCustomer,
        addProduct,
        addProducts,
        updateProduct,
        deleteProduct,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        updateProductionStatuses,
        updatePaymentStatuses,
        updatePaymentMethods,
        importState,
        exportDatabaseFile,
        importDatabaseFile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
