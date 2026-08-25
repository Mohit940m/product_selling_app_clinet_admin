import { useState } from 'react';
import { FiClock, FiPackage, FiSearch } from 'react-icons/fi';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import Chip from '../components/ui/Chip';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import statusTone from '../components/ui/statusTone';

// Matches product_selling_app_server/src/models/orderModels/order.model.ts ORDER_STATUS.
type OrderStatus = 'all' | 'CREATED' | 'CONFIRMED' | 'SHIPPED' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'CANCELLED';

const STATUS_LABELS: Record<OrderStatus, string> = {
  all: 'All',
  CREATED: 'Created',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  'OUT FOR DELIVERY': 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const FILTER_TABS: OrderStatus[] = ['all', 'CREATED', 'CONFIRMED', 'SHIPPED', 'OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED'];

/**
 * There is currently no seller endpoint to list orders — the seller
 * routes (product_selling_app_server/src/routes/seller.routes/) only
 * cover auth, products, shipping, and offers. This stays an honest
 * EmptyState rather than fabricating order rows. The status vocabulary
 * above is real (read from the Order model) so the UI is ready to wire
 * up the moment a list-orders endpoint exists.
 */
const OrderListPage = () => {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<OrderStatus>('all');

  return (
    <Container className="py-6 lg:py-8">
      <PageHeader
        title="Orders"
        subtitle="Track and manage customer orders, update statuses, and review order details."
      />

      <div className="rounded-panel border border-line bg-card">
        <div className="border-b border-line p-4">
          <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full border border-line px-4 py-2.5 t-fast focus-within:border-accent lg:max-w-[340px]">
              <FiSearch className="shrink-0 text-muted" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-base outline-none placeholder:text-muted sm:text-[12.5px]"
                placeholder="Search by order ID or customer name"
              />
            </div>
            <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
              {FILTER_TABS.map((status) => (
                <Chip key={status} selected={activeStatus === status} onClick={() => setActiveStatus(status)}>
                  {STATUS_LABELS[status]}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8">
          <EmptyState
            icon={<FiPackage size={30} />}
            title="No orders yet"
            description="Orders placed by customers will appear here."
            action={
              <span className="flex items-center gap-2 rounded-full border border-line bg-soft2 px-4 py-2 text-xs font-semibold text-muted">
                <FiClock size={14} className="text-accent" />
                Order management API routes coming soon
              </span>
            }
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] font-medium text-muted">
            {activeStatus === 'all' ? 'Showing all orders' : `Filtered by: ${STATUS_LABELS[activeStatus]}`}
            {search && ` · Search: "${search}"`}
          </p>
          <div className="flex flex-wrap gap-2">
            {(['CONFIRMED', 'OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED'] as const).map((status) => (
              <Badge key={status} tone={statusTone(status)}>{STATUS_LABELS[status]}</Badge>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default OrderListPage;
