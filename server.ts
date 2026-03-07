import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database setup
const dbPath = path.join(__dirname, "database.sqlite");
let db: Database.Database;

function initDb() {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  // Create tables for Key-Value store pattern
  db.exec(`
    CREATE TABLE IF NOT EXISTS company_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS custom_options (
      id TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (id, type)
    );
  `);
}

async function startServer() {
  try {
    initDb();
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  const upload = multer({ dest: 'uploads/' });

  // API Routes
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get full app state
  app.get("/api/state", (req, res) => {
    try {
      const companyInfoRow = db.prepare("SELECT data FROM company_info WHERE id = 1").get() as { data: string } | undefined;
      const ordersRows = db.prepare("SELECT data FROM orders").all() as { data: string }[];
      const customersRows = db.prepare("SELECT data FROM customers").all() as { data: string }[];
      const productsRows = db.prepare("SELECT data FROM products").all() as { data: string }[];
      const employeesRows = db.prepare("SELECT data FROM employees").all() as { data: string }[];
      const rolesRows = db.prepare("SELECT data FROM roles").all() as { data: string }[];
      const productionStatusesRows = db.prepare("SELECT data FROM custom_options WHERE type = 'production_status'").all() as { data: string }[];
      const paymentStatusesRows = db.prepare("SELECT data FROM custom_options WHERE type = 'payment_status'").all() as { data: string }[];
      const paymentMethodsRows = db.prepare("SELECT data FROM custom_options WHERE type = 'payment_method'").all() as { data: string }[];

      const parseRows = (rows: { data: string }[]) => rows.map(r => JSON.parse(r.data));

      const state = {
        companyInfo: companyInfoRow ? JSON.parse(companyInfoRow.data) : null,
        orders: parseRows(ordersRows),
        customers: parseRows(customersRows),
        products: parseRows(productsRows),
        employees: parseRows(employeesRows),
        roles: parseRows(rolesRows),
        productionStatuses: parseRows(productionStatusesRows),
        paymentStatuses: parseRows(paymentStatusesRows),
        paymentMethods: parseRows(paymentMethodsRows),
      };

      res.json(state);
    } catch (error) {
      console.error("Error fetching state:", error);
      res.status(500).json({ error: "Failed to fetch state" });
    }
  });

  // Save full app state
  app.post("/api/state", (req, res) => {
    try {
      const state = req.body;
      
      const insertCompanyInfo = db.prepare("INSERT OR REPLACE INTO company_info (id, data) VALUES (1, ?)");
      const insertOrder = db.prepare("INSERT OR REPLACE INTO orders (id, data) VALUES (?, ?)");
      const insertCustomer = db.prepare("INSERT OR REPLACE INTO customers (id, data) VALUES (?, ?)");
      const insertProduct = db.prepare("INSERT OR REPLACE INTO products (id, data) VALUES (?, ?)");
      const insertEmployee = db.prepare("INSERT OR REPLACE INTO employees (id, data) VALUES (?, ?)");
      const insertRole = db.prepare("INSERT OR REPLACE INTO roles (id, data) VALUES (?, ?)");
      const insertOption = db.prepare("INSERT OR REPLACE INTO custom_options (id, type, data) VALUES (?, ?, ?)");

      const deleteOrders = db.prepare("DELETE FROM orders");
      const deleteCustomers = db.prepare("DELETE FROM customers");
      const deleteProducts = db.prepare("DELETE FROM products");
      const deleteEmployees = db.prepare("DELETE FROM employees");
      const deleteRoles = db.prepare("DELETE FROM roles");
      const deleteOptions = db.prepare("DELETE FROM custom_options");

      const transaction = db.transaction(() => {
        if (state.companyInfo) insertCompanyInfo.run(JSON.stringify(state.companyInfo));

        deleteOrders.run();
        state.orders?.forEach((o: any) => insertOrder.run(o.id, JSON.stringify(o)));

        deleteCustomers.run();
        state.customers?.forEach((c: any) => insertCustomer.run(c.id, JSON.stringify(c)));

        deleteProducts.run();
        state.products?.forEach((p: any) => insertProduct.run(p.id, JSON.stringify(p)));

        deleteEmployees.run();
        state.employees?.forEach((e: any) => insertEmployee.run(e.id, JSON.stringify(e)));

        deleteRoles.run();
        state.roles?.forEach((r: any) => insertRole.run(r.id, JSON.stringify(r)));

        deleteOptions.run();
        state.productionStatuses?.forEach((s: any) => insertOption.run(`prod_${s.id}`, 'production_status', JSON.stringify(s)));
        state.paymentStatuses?.forEach((s: any) => insertOption.run(`pay_${s.id}`, 'payment_status', JSON.stringify(s)));
        state.paymentMethods?.forEach((s: any) => insertOption.run(`meth_${s.id}`, 'payment_method', JSON.stringify(s)));
      });

      transaction();
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving state:", error);
      res.status(500).json({ error: "Failed to save state" });
    }
  });

  // Export database file
  app.get("/api/export", (req, res) => {
    console.log("Export database request received");
    try {
      // Checkpoint WAL to ensure main file is up to date
      db.pragma('wal_checkpoint(RESTART)');
      console.log("WAL checkpoint completed");
      
      const fileBuffer = fs.readFileSync(dbPath);
      res.setHeader('Content-Type', 'application/x-sqlite3');
      res.setHeader('Content-Disposition', 'attachment; filename="backup.sqlite"');
      res.send(fileBuffer);
      console.log("Database exported successfully");
    } catch (error) {
      console.error("Error exporting database:", error);
      res.status(500).json({ error: "Failed to export database" });
    }
  });

  // Import database file
  app.post("/api/import", upload.single('database'), (req, res) => {
    console.log("Import request received");
    const backupPath = dbPath + '.bak';
    
    try {
      if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
      }
      console.log("File uploaded:", req.file.path);

      // Validate the uploaded file is a valid SQLite database
      try {
        const tempDb = new Database(req.file.path, { fileMustExist: true });
        tempDb.pragma('quick_check');
        tempDb.close();
        console.log("Uploaded file validation successful");
      } catch (validationError) {
        console.error("Uploaded file is not a valid SQLite database:", validationError);
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Invalid SQLite file" });
      }

      // Close current connection
      if (db) {
        try {
          db.close();
          console.log("Database closed");
        } catch (e) {
          console.warn("Error closing database (might be already closed):", e);
        }
      }

      // Backup existing database
      if (fs.existsSync(dbPath)) {
        console.log("Backing up current database to", backupPath);
        fs.copyFileSync(dbPath, backupPath);
      }

      // Replace file
      console.log("Replacing file:", req.file.path, "with", dbPath);
      try {
        fs.copyFileSync(req.file.path, dbPath);
        fs.unlinkSync(req.file.path); // Clean up uploaded file
        console.log("File replaced");
        
        // Remove WAL/SHM files to prevent corruption with new DB
        if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
        if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
        
        // Re-open connection
        initDb();
        console.log("Database re-opened successfully");
        
        // If successful, remove backup (optional, or keep it for safety)
        // fs.unlinkSync(backupPath); 
        
        res.json({ success: true });
      } catch (replaceError) {
        console.error("Error during replacement/re-init:", replaceError);
        
        // Restore from backup
        if (fs.existsSync(backupPath)) {
          console.log("Restoring from backup...");
          fs.copyFileSync(backupPath, dbPath);
          // Try to re-init with backup
          try { initDb(); } catch (e) { console.error("Fatal: Could not restore backup", e); }
        }
        
        res.status(500).json({ error: "Failed to import database, restored previous version" });
      }
    } catch (error) {
      console.error("Unexpected error importing database:", error);
      // Ensure DB is open if possible
      try { if (!db || !db.open) initDb(); } catch (e) {}
      res.status(500).json({ error: "Failed to import database" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
