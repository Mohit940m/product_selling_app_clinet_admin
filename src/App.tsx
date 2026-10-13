import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { ThemeProvider } from "./theme/ThemeProvider"
import { useTheme } from "./theme/useTheme"
import ErrorBoundary from "./components/ErrorBoundary"
import AdminLayout from "./components/layout/AdminLayout"
import RequireSellerAuth from "./components/layout/RequireSellerAuth"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import DashboardPage from "./pages/DashboardPage"
import ProductListPage from "./pages/ProductListPage"
import OrderListPage from "./pages/OrderListPage"
import CheckoutsPage from "./pages/CheckoutsPage"
import AddProductPage from "./pages/AddProductPage"
import ProductDetailsPage from "./pages/ProductDetailsPage"
import EditProductPage from "./pages/EditProductPage"
import ShippingConfigPage from "./pages/ShippingConfigPage"
import OffersPage from "./pages/OffersPage"
import AssistantPage from './pages/AssistantPage'
import NotFoundPage from "./pages/NotFoundPage"

const AppRoutes = () => {
  const { theme } = useTheme()

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          <Route element={<RequireSellerAuth />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductListPage />} />
              <Route path="/products/new" element={<AddProductPage />} />
              <Route path="/products/:productId" element={<ProductDetailsPage />} />
              <Route path="/products/:productId/edit" element={<EditProductPage />} />
              <Route path="/orders" element={<OrderListPage />} />
              <Route path="/checkouts" element={<CheckoutsPage />} />
              <Route path="/shipping" element={<ShippingConfigPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
            </Route>
          </Route>

          {/* Catch-all: React Router renders nothing for an unmatched path
              otherwise — a blank white screen with no way back. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme={theme}
        toastClassName="rounded-[var(--radius-tile)] border border-line bg-card text-ink shadow-kartly"
        progressClassName="bg-accent"
      />
    </Router>
  )
}

const App = () => {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}

export default App
