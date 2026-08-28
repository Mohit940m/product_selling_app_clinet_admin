import { FiClock, FiPackage } from 'react-icons/fi';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import statusTone from '../components/ui/statusTone';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Matches product_selling_app_server/src/models/orderModels/order.model.ts ORDER_STATUS.
type OrderStatus = 'CREATED' | 'CONFIRMED' | 'SHIPPED' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'CANCELLED';

const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'Created',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  'OUT FOR DELIVERY': 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/**
 * There is currently no seller endpoint to list orders — the seller
 * routes (product_selling_app_server/src/routes/seller.routes/) only
 * cover auth, products, shipping, and offers. This stays an honest
 * EmptyState rather than fabricating order rows.
 *
 * An earlier version of this page also shipped a search input and a
 * status-filter Chip rail (4.6.6/4.6.9) that updated local state with no
 * effect on what's shown — the EmptyState below renders unconditionally
 * regardless of search/filter, so those controls looked interactive but
 * did nothing. Removed them rather than ship dead controls; only the
 * real status vocabulary (read from the Order model) stays, as a plain
 * non-interactive legend so the page is still honest about what
 * statuses this seller API will eventually support.
 */
const OrderListPage = () => {
  useDocumentTitle('Orders');
  return (
    <Container className="py-6 lg:py-8">
      <PageHeader
        title="Orders"
        subtitle="Track and manage customer orders, update statuses, and review order details."
      />

      <div className="rounded-panel border border-line bg-card">
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

        <div className="border-t border-line px-4 py-3.5">
          <p className="mb-2.5 text-[12.5px] font-medium text-muted">Order statuses this page will support once available:</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
              <Badge key={status} tone={statusTone(status)}>{STATUS_LABELS[status]}</Badge>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default OrderListPage;
