import { Order, ProductItem } from '../types';

export const calculateItemTotal = (item: ProductItem) => {
  const subtotal = item.quantity * item.unitPrice;
  if (item.discountType === 'percentage') {
    return subtotal * (1 - item.discountValue / 100);
  }
  return Math.max(0, subtotal - item.discountValue);
};

export const calculateOrderTotal = (order: Order | Partial<Order>) => {
  const subtotal = (order.items || []).reduce((sum, item) => sum + calculateItemTotal(item), 0);
  if (order.generalDiscountType === 'percentage') {
    return subtotal * (1 - (order.generalDiscountValue || 0) / 100);
  }
  return Math.max(0, subtotal - (order.generalDiscountValue || 0));
};

export const calculateItemCost = (item: ProductItem) => {
  return item.quantity * (item.costPrice || 0);
};

export const calculateOrderProfit = (order: Order | Partial<Order>) => {
  const totalRevenue = calculateOrderTotal(order);
  const totalCost = (order.items || []).reduce((sum, item) => sum + calculateItemCost(item), 0);
  return totalRevenue - totalCost;
};
