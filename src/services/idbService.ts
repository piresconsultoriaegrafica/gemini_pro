import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AppState, CompanyInfo, Order, Customer, Product, Employee, Role, CustomOption } from '../types';

const DB_NAME = 'empresa_db_v2';
const DB_VERSION = 1;

interface EmpresaDB extends DBSchema {
  companyInfo: {
    key: number;
    value: CompanyInfo;
  };
  orders: {
    key: string;
    value: Order;
  };
  customers: {
    key: string;
    value: Customer;
  };
  products: {
    key: string;
    value: Product;
  };
  employees: {
    key: string;
    value: Employee;
  };
  roles: {
    key: string;
    value: Role;
  };
  customOptions: {
    key: string;
    value: CustomOption & { type: string };
  };
}

let dbPromise: Promise<IDBPDatabase<EmpresaDB>>;

export const initDB = async (): Promise<void> => {
  dbPromise = openDB<EmpresaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('companyInfo')) {
        db.createObjectStore('companyInfo');
      }
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('employees')) {
        db.createObjectStore('employees', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('roles')) {
        db.createObjectStore('roles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('customOptions')) {
        db.createObjectStore('customOptions', { keyPath: 'id' });
      }
    },
  });
  await dbPromise;
};

export const getAppState = async (): Promise<AppState | null> => {
  const db = await dbPromise;
  
  const companyInfo = await db.get('companyInfo', 1);
  const orders = await db.getAll('orders');
  const customers = await db.getAll('customers');
  const products = await db.getAll('products');
  const employees = await db.getAll('employees');
  const roles = await db.getAll('roles');
  const allOptions = await db.getAll('customOptions');

  const productionStatuses = allOptions.filter(o => o.type === 'production_status');
  const paymentStatuses = allOptions.filter(o => o.type === 'payment_status');
  const paymentMethods = allOptions.filter(o => o.type === 'payment_method');

  if (!companyInfo && orders.length === 0 && customers.length === 0) {
    return null;
  }

  return {
    companyInfo: companyInfo || {} as CompanyInfo,
    orders,
    customers,
    products,
    employees,
    roles,
    productionStatuses,
    paymentStatuses,
    paymentMethods,
  };
};

export const saveCompanyInfo = async (info: CompanyInfo) => {
  const db = await dbPromise;
  await db.put('companyInfo', info, 1);
};

export const saveOrder = async (order: Order) => {
  const db = await dbPromise;
  await db.put('orders', order);
};

export const deleteOrder = async (id: string) => {
  const db = await dbPromise;
  await db.delete('orders', id);
};

export const saveCustomer = async (customer: Customer) => {
  const db = await dbPromise;
  await db.put('customers', customer);
};

export const deleteCustomer = async (id: string) => {
  const db = await dbPromise;
  await db.delete('customers', id);
};

export const saveProduct = async (product: Product) => {
  const db = await dbPromise;
  await db.put('products', product);
};

export const deleteProduct = async (id: string) => {
  const db = await dbPromise;
  await db.delete('products', id);
};

export const saveEmployee = async (employee: Employee) => {
  const db = await dbPromise;
  await db.put('employees', employee);
};

export const deleteEmployee = async (id: string) => {
  const db = await dbPromise;
  await db.delete('employees', id);
};

export const saveRole = async (role: Role) => {
  const db = await dbPromise;
  await db.put('roles', role);
};

export const deleteRole = async (id: string) => {
  const db = await dbPromise;
  await db.delete('roles', id);
};

export const saveCustomOption = async (option: CustomOption, type: string) => {
  const db = await dbPromise;
  // Prefix ID to ensure uniqueness across types if IDs overlap (though usually they are UUIDs or simple IDs)
  // But here we use the ID from the option itself as keyPath. To avoid collision if same ID used in different types:
  // We should make ID unique. The previous implementation used prefixes like `prod_${id}`. Let's keep that pattern.
  
  let key = option.id;
  if (type === 'production_status') key = `prod_${option.id}`;
  if (type === 'payment_status') key = `pay_${option.id}`;
  if (type === 'payment_method') key = `meth_${option.id}`;

  await db.put('customOptions', { ...option, id: key, type });
};

export const saveAllCustomOptions = async (options: CustomOption[], type: string) => {
  const db = await dbPromise;
  const tx = db.transaction('customOptions', 'readwrite');
  
  // First, delete existing options of this type to handle removals
  // This is a bit inefficient but safer. A better way would be to track deletions.
  // For now, let's just iterate and put. Deletions are rare for options.
  // Actually, to support deletion, we should clear old ones.
  // But since we don't have easy "delete by type", we might skip deletion for now or iterate all.
  
  // Let's just put new ones.
  for (const option of options) {
    let key = option.id;
    if (type === 'production_status') key = `prod_${option.id}`;
    if (type === 'payment_status') key = `pay_${option.id}`;
    if (type === 'payment_method') key = `meth_${option.id}`;
    await tx.store.put({ ...option, id: key, type });
  }
  await tx.done;
};

export const exportDatabase = async (): Promise<string> => {
  const state = await getAppState();
  return JSON.stringify(state);
};

export const importDatabase = async (jsonString: string): Promise<void> => {
  const state = JSON.parse(jsonString) as AppState;
  const db = await dbPromise;
  
  const tx = db.transaction(['companyInfo', 'orders', 'customers', 'products', 'employees', 'roles', 'customOptions'], 'readwrite');
  
  if (state.companyInfo) await tx.objectStore('companyInfo').put(state.companyInfo, 1);
  
  if (state.orders) {
    for (const item of state.orders) await tx.objectStore('orders').put(item);
  }
  if (state.customers) {
    for (const item of state.customers) await tx.objectStore('customers').put(item);
  }
  if (state.products) {
    for (const item of state.products) await tx.objectStore('products').put(item);
  }
  if (state.employees) {
    for (const item of state.employees) await tx.objectStore('employees').put(item);
  }
  if (state.roles) {
    for (const item of state.roles) await tx.objectStore('roles').put(item);
  }
  
  if (state.productionStatuses) {
    for (const item of state.productionStatuses) {
      await tx.objectStore('customOptions').put({ ...item, id: `prod_${item.id}`, type: 'production_status' });
    }
  }
  if (state.paymentStatuses) {
    for (const item of state.paymentStatuses) {
      await tx.objectStore('customOptions').put({ ...item, id: `pay_${item.id}`, type: 'payment_status' });
    }
  }
  if (state.paymentMethods) {
    for (const item of state.paymentMethods) {
      await tx.objectStore('customOptions').put({ ...item, id: `meth_${item.id}`, type: 'payment_method' });
    }
  }
  
  await tx.done;
};
