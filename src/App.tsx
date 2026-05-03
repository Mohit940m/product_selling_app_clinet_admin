import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import DashboardPage from "./pages/DashboardPage"
import ProductListPage from "./pages/ProductListPage"
import OrderListPage from "./pages/OrderListPage"
import AddProductPage from "./pages/AddProductPage"
import ProductDetailsPage from "./pages/ProductDetailsPage"
import EditProductPage from "./pages/EditProductPage"

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/new" element={<AddProductPage />} />
        <Route path="/products/:productId" element={<ProductDetailsPage />} />
        <Route path="/products/:productId/edit" element={<EditProductPage />} />
        <Route path="/orders" element={<OrderListPage />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
        toastClassName="rounded-lg border border-gray-200 bg-white text-[#1F2937] shadow-md"
        progressClassName="bg-[#A78BFA]"
      />
    </Router>
  )
}

export default App
