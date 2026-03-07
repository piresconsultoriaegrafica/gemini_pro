-- Schema para Cloudflare D1
-- Empresa Dashboard Pro

-- Tabela de Informações da Empresa
CREATE TABLE IF NOT EXISTS company_info (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  background_image_url TEXT,
  login_icon_url TEXT,
  printer_paper_size TEXT DEFAULT '80mm',
  direct_print BOOLEAN DEFAULT 0,
  instagram TEXT,
  website TEXT,
  view_mode TEXT DEFAULT 'auto',
  theme TEXT DEFAULT 'auto',
  developed_by TEXT,
  registered_to TEXT,
  app_version TEXT
);

-- Tabela de Filiais
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  name TEXT NOT NULL,
  address TEXT,
  FOREIGN KEY (company_id) REFERENCES company_info(id)
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  document TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Funcionários
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  base_price REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Variações de Produtos
CREATE TABLE IF NOT EXISTS product_variations (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabela de Opções Customizadas (Status de Produção, Status de Pagamento, Métodos de Pagamento)
CREATE TABLE IF NOT EXISTS custom_options (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'production_status', 'payment_status', 'payment_method'
  label TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Tabela de Pedidos / Ordens de Serviço
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  queue_number INTEGER,
  customer_name TEXT,
  customer_phone TEXT,
  employee_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  estimated_delivery_date DATETIME,
  status TEXT,
  payment_status TEXT,
  payment_method TEXT,
  general_discount_type TEXT, -- 'percentage' ou 'value'
  general_discount_value REAL,
  amount_paid REAL,
  general_observations TEXT,
  archived BOOLEAN DEFAULT 0,
  archive_reason TEXT,
  deleted BOOLEAN DEFAULT 0,
  finalized BOOLEAN DEFAULT 0,
  is_quotation BOOLEAN DEFAULT 0,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  discount_type TEXT, -- 'percentage' ou 'value'
  discount_value REAL,
  observations TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
