import type { BadgeTone } from './Badge';

/**
 * Maps a raw backend order/payment status string to a Badge tone. Backend
 * enum (product_selling_app_server/src/models/orderModels/order.model.ts):
 *   orderStatus:   CREATED | CONFIRMED | SHIPPED | "OUT FOR DELIVERY" | DELIVERED | CANCELLED
 *   paymentStatus: PENDING | PAID | FAILED | REFUNDED
 * Every page maps status → Badge tone through this one function so no page
 * hand-rolls its own colour mapping.
 */
export const statusTone = (status: string | undefined | null): BadgeTone => {
  const normalized = (status ?? '').trim().toUpperCase();

  switch (normalized) {
    case 'DELIVERED':
    case 'PAID':
      return 'success';
    case 'CONFIRMED':
    case 'SHIPPED':
      return 'plum';
    case 'CREATED':
    case 'PENDING':
    case 'OUT FOR DELIVERY':
      return 'warn';
    case 'CANCELLED':
    case 'FAILED':
    case 'REFUNDED':
      return 'danger';
    default:
      return 'plum';
  }
};

export default statusTone;
