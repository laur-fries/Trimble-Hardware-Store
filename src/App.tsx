import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ShoppingCartPage from './pages/ShoppingCartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import YourOrdersPage from './pages/YourOrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import { CartProvider } from './cart/CartContext';
import { DaProvider } from './da/DaContext';

export default function App() {
  return (
    <CartProvider>
      <DaProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="product/:productKey" element={<ProductDetailPage />} />
            <Route path="cart" element={<ShoppingCartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route
              path="order-confirmation"
              element={<OrderConfirmationPage />}
            />
            <Route path="account/orders" element={<YourOrdersPage />} />
            <Route
              path="account/pending-approvals"
              element={
                <Navigate to="/account/orders?tab=pending" replace />
              }
            />
          </Route>
        </Routes>
      </DaProvider>
    </CartProvider>
  );
}
