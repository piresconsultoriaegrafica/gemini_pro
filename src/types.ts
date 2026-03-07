export type DiscountType = 'percentage' | 'value';

export interface CustomOption {
  id: string;
  label: string;
  color: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  document?: string;
}

export interface Employee {
  id: string;
  name: string;
  login: string;
  password?: string;
  role: string;
}

export interface Role {
  id: string;
  name: string;
  level: number;
  permissions: string[];
}

export interface ProductVariation {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  markup: number;
  barcode?: string;
}

export interface CompositionItem {
  productId: string;
  quantity: number;
}

export interface Product {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  description: string;
  basePrice: number;
  costPrice: number;
  markup: number;
  isKit: boolean;
  composition: CompositionItem[];
  variations: ProductVariation[];
}

export interface ProductItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice: number; // Captured at order time
  discountType: DiscountType;
  discountValue: number;
  observations: string;
}

export interface Order {
  id: string;
  queueNumber: number;
  customerName: string;
  customerPhone: string;
  employeeId?: string;
  createdAt: string; // ISO string
  estimatedDeliveryDate: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  items: ProductItem[];
  generalDiscountType: DiscountType;
  generalDiscountValue: number;
  amountPaid: number;
  generalObservations: string;
  archived: boolean;
  archiveReason?: string;
  deleted?: boolean;
  finalized?: boolean;
  isQuotation?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export interface CompanyInfo {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  backgroundImageUrl?: string;
  loginIconUrl?: string;
  printerPaperSize?: '50mm' | '80mm' | 'standard';
  directPrint?: boolean;
  instagram?: string;
  website?: string;
  branches?: Branch[];
  viewMode?: 'auto' | 'desktop' | 'tablet' | 'mobile';
  theme?: 'auto' | 'light' | 'dark';
  developedBy?: string;
  registeredTo?: string;
  appVersion?: string;
}

export interface AppState {
  companyInfo: CompanyInfo;
  orders: Order[];
  customers: Customer[];
  products: Product[];
  employees: Employee[];
  roles: Role[];
  productionStatuses: CustomOption[];
  paymentStatuses: CustomOption[];
  paymentMethods: CustomOption[];
  customStatuses?: string[]; // Deprecated
  customPaymentStatuses?: string[]; // Deprecated
}
