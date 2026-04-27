import Header from '../components/Header';

const OrderListPage = () => {
  return (
    <>
      <Header />
      <div className="p-4 bg-background min-h-screen">
        <h1 className="text-3xl font-bold text-text">Order List</h1>
        <p className="mt-2 text-gray-600">Manage your orders here.</p>
        {/* Add order list components here */}
      </div>
    </>
  );
};

export default OrderListPage;
