/**
 * Integração com Cloudflare D1
 * 
 * Este arquivo contém as funções necessárias para conectar sua aplicação ao banco de dados D1 da Cloudflare.
 * Para utilizar, você precisará configurar as variáveis de ambiente com suas credenciais do Cloudflare.
 * 
 * Variáveis necessárias no seu .env:
 * VITE_CLOUDFLARE_ACCOUNT_ID=seu_account_id
 * VITE_CLOUDFLARE_DATABASE_ID=seu_database_id
 * VITE_CLOUDFLARE_API_TOKEN=seu_api_token
 */

const ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = import.meta.env.VITE_CLOUDFLARE_DATABASE_ID;
const API_TOKEN = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;

const D1_API_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

/**
 * Executa uma query SQL no Cloudflare D1
 * @param sql A query SQL a ser executada
 * @param params Parâmetros opcionais para a query (array)
 * @returns O resultado da query
 */
export async function executeD1Query(sql: string, params: any[] = []) {
  if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
    console.warn("Credenciais do Cloudflare D1 não configuradas.");
    return null;
  }

  try {
    const response = await fetch(D1_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql: sql,
        params: params,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro D1: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.result[0]; // Retorna o primeiro resultado do batch
  } catch (error) {
    console.error("Falha ao executar query no D1:", error);
    throw error;
  }
}

// ==========================================
// EXEMPLOS DE FUNÇÕES DE INTEGRAÇÃO (CRUD)
// ==========================================

/**
 * Busca todos os clientes do D1
 */
export async function getCustomersFromD1() {
  const result = await executeD1Query("SELECT * FROM customers ORDER BY created_at DESC");
  return result?.results || [];
}

/**
 * Salva um novo cliente no D1
 */
export async function saveCustomerToD1(customer: any) {
  const sql = `
    INSERT INTO customers (id, name, phone, email, document) 
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [
    customer.id, 
    customer.name, 
    customer.phone, 
    customer.email || null, 
    customer.document || null
  ];
  
  return await executeD1Query(sql, params);
}

/**
 * Atualiza um cliente existente no D1
 */
export async function updateCustomerInD1(customer: any) {
  const sql = `
    UPDATE customers 
    SET name = ?, phone = ?, email = ?, document = ?
    WHERE id = ?
  `;
  const params = [
    customer.name, 
    customer.phone, 
    customer.email || null, 
    customer.document || null,
    customer.id
  ];
  
  return await executeD1Query(sql, params);
}

/**
 * Remove um cliente do D1
 */
export async function deleteCustomerFromD1(id: string) {
  return await executeD1Query("DELETE FROM customers WHERE id = ?", [id]);
}

/**
 * Sincroniza um pedido completo (com itens) para o D1
 */
export async function saveOrderToD1(order: any) {
  // 1. Salvar o pedido principal
  const orderSql = `
    INSERT INTO orders (
      id, queue_number, customer_name, customer_phone, employee_id, 
      created_at, estimated_delivery_date, status, payment_status, payment_method,
      general_discount_type, general_discount_value, amount_paid, general_observations,
      archived, archive_reason, deleted, finalized, is_quotation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      payment_status = excluded.payment_status,
      archived = excluded.archived,
      deleted = excluded.deleted,
      finalized = excluded.finalized
  `;
  
  const orderParams = [
    order.id, order.queueNumber, order.customerName, order.customerPhone, order.employeeId || null,
    order.createdAt, order.estimatedDeliveryDate, order.status, order.paymentStatus, order.paymentMethod,
    order.generalDiscountType, order.generalDiscountValue, order.amountPaid, order.generalObservations,
    order.archived ? 1 : 0, order.archiveReason || null, order.deleted ? 1 : 0, order.finalized ? 1 : 0, order.isQuotation ? 1 : 0
  ];
  
  await executeD1Query(orderSql, orderParams);
  
  // 2. Limpar itens antigos (se for atualização)
  await executeD1Query("DELETE FROM order_items WHERE order_id = ?", [order.id]);
  
  // 3. Inserir os itens atualizados
  for (const item of order.items) {
    const itemSql = `
      INSERT INTO order_items (id, order_id, name, quantity, unit_price, discount_type, discount_value, observations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const itemParams = [
      item.id, order.id, item.name, item.quantity, item.unitPrice, 
      item.discountType, item.discountValue, item.observations || null
    ];
    await executeD1Query(itemSql, itemParams);
  }
  
  return true;
}
