import { Link, useNavigate } from 'react-router-dom';
import { FiPackage, FiPlus } from 'react-icons/fi';
import Header from '../components/Header';
import Button from '../components/Button';

const ProductListPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Catalog</p>
            <h1 className="mt-2 text-2xl font-bold text-text">Products</h1>
            <p className="mt-1 text-sm text-gray-600">Create and manage seller product listings.</p>
          </div>
          <Button
            type="button"
            label="Add product"
            icon={<FiPlus size={18} />}
            onClick={() => navigate('/products/new')}
            className="py-3"
          />
        </div>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md">
          <FiPackage className="mx-auto text-primary" size={32} />
          <h2 className="mt-3 text-lg font-bold text-text">Product list is ready for data</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
            Add a product first, then this page can be expanded into full search, filters, status controls, and stock actions.
          </p>
          <Link to="/products/new" className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline">
            Create your first product
          </Link>
        </section>
      </main>
    </div>
  );
};

export default ProductListPage;
