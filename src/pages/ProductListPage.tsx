import Header from '../components/Header';

const ProductListPage = () => {
  return (
    <>
      <Header />
      <div className="p-4 bg-background min-h-screen">
        <h1 className="text-3xl font-bold text-text">Product List</h1>
        <p className="mt-2 text-gray-600">Manage your products here.</p>
        {/* Add product list components here */}
      </div>
    </>
  );
};

export default ProductListPage;
