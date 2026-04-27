const Header = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-primary text-white">
      <h1 className="text-xl font-bold">Admin Panel</h1>
      <nav>
        <ul className="flex space-x-4">
          <li><a href="/dashboard" className="hover:underline">Dashboard</a></li>
          <li><a href="/products" className="hover:underline">Products</a></li>
          <li><a href="/orders" className="hover:underline">Orders</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
