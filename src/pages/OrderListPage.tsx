import { useState } from 'react';
import { FiClock, FiPackage, FiSearch } from 'react-icons/fi';
type OrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_LABELS: Record<OrderStatus, string> = {
  all: 'All',
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<Exclude<OrderStatus, 'all'>, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const FILTER_TABS: OrderStatus[] = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const OrderListPage = () => {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<OrderStatus>('all');

  return (
    <div className="min-h-screen bg-background text-text">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Fulfillment</p>
            <h1 className="mt-2 text-2xl font-bold text-text">Orders</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track and manage customer orders, update statuses, and review order details.
            </p>
          </div>
        </div>

        <section className="rounded-lg border border-gray-200 bg-white shadow-md">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 items-center rounded-lg border border-gray-200 bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-primary">
                <FiSearch className="text-primary" size={20} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full px-3 py-3 text-sm outline-none"
                  placeholder="Search by order ID or customer name"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTER_TABS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setActiveStatus(status)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                      activeStatus === status
                        ? 'bg-primary text-white'
                        : 'border border-gray-200 text-gray-600 hover:border-primary hover:text-accent'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-3 pr-4 pl-4 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="py-3 pr-4 pl-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-primary">
                        <FiPackage size={32} />
                      </span>
                      <div>
                        <p className="font-semibold text-text">No orders yet</p>
                        <p className="mt-1 text-sm text-gray-600">
                          Orders placed by customers will appear here.
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-secondary px-4 py-2 text-xs text-gray-600">
                        <FiClock size={14} className="text-primary" />
                        Order management API routes coming soon
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600">
              {activeStatus === 'all' ? 'Showing all orders' : `Filtered by: ${STATUS_LABELS[activeStatus]}`}
              {search && ` · Search: "${search}"`}
            </p>
            <div className="flex gap-2">
              {Object.entries(STATUS_STYLES).map(([status, style]) => (
                <span key={status} className={`rounded-lg px-2 py-1 text-xs font-bold ${style}`}>
                  {STATUS_LABELS[status as Exclude<OrderStatus, 'all'>]}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OrderListPage;
