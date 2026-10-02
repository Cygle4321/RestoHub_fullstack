import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ToastProvider, Spinner } from "./components/ui";
import { CartProvider } from "./store/CartContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const StoreLayout = lazy(() => import("./layouts/StoreLayout"));

const Landing = lazy(() => import("./pages/public/Landing"));
const Login = lazy(() => import("./pages/public/Login"));
const Register = lazy(() => import("./pages/public/Register"));
const ForgotPassword = lazy(() => import("./pages/public/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/public/ResetPassword"));
const EmailVerified = lazy(() => import("./pages/public/EmailVerified"));
const Terms = lazy(() => import("./pages/public/Terms"));
const Privacy = lazy(() => import("./pages/public/Privacy"));
const Onboarding = lazy(() => import("./pages/onboarding/Onboarding"));

const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const Orders = lazy(() => import("./pages/dashboard/Orders"));
const Kitchen = lazy(() => import("./pages/dashboard/Kitchen"));
const OrderDetails = lazy(() => import("./pages/dashboard/OrderDetails"));
const Products = lazy(() => import("./pages/dashboard/Products"));
const ProductForm = lazy(() => import("./pages/dashboard/ProductForm"));
const Categories = lazy(() => import("./pages/dashboard/Categories"));
const Customers = lazy(() => import("./pages/dashboard/Customers"));
const CustomerDetails = lazy(() => import("./pages/dashboard/CustomerDetails"));
const Delivery = lazy(() => import("./pages/dashboard/Delivery"));
const Promotions = lazy(() => import("./pages/dashboard/Promotions"));
const Analytics = lazy(() => import("./pages/dashboard/Analytics"));
const ShopSettings = lazy(() => import("./pages/dashboard/ShopSettings"));
const QrCode = lazy(() => import("./pages/dashboard/QrCode"));
const Billing = lazy(() => import("./pages/dashboard/Billing"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const Support = lazy(() => import("./pages/dashboard/Support"));

const StoreHome = lazy(() => import("./pages/store/StoreHome"));
const StoreMenu = lazy(() => import("./pages/store/StoreMenu"));
const ProductDetails = lazy(() => import("./pages/store/ProductDetails"));
const Cart = lazy(() => import("./pages/store/Cart"));
const Checkout = lazy(() => import("./pages/store/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/store/OrderConfirmation"));
const OrderTracking = lazy(() => import("./pages/store/OrderTracking"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRestaurants = lazy(() => import("./pages/admin/AdminRestaurants"));
const AdminRestaurantDetails = lazy(() => import("./pages/admin/AdminRestaurantDetails"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8]">
                <Spinner label="Chargement…" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/email-verified", element: <EmailVerified /> },
      { path: "/terms", element: <Terms /> },
      { path: "/privacy", element: <Privacy /> },
      { path: "/onboarding", element: <Onboarding /> },

      // Restaurant dashboard — owner | staff
      {
        element: <ProtectedRoute roles={["owner", "staff"]} />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardHome /> },
              { path: "orders", element: <Orders /> },
              { path: "orders/:id", element: <OrderDetails /> },
              { path: "kitchen", element: <Kitchen /> },
              { path: "products", element: <Products /> },
              { path: "products/new", element: <ProductForm /> },
              { path: "products/:id/edit", element: <ProductForm /> },
              { path: "categories", element: <Categories /> },
              { path: "customers", element: <Customers /> },
              { path: "customers/:id", element: <CustomerDetails /> },
              { path: "delivery", element: <Delivery /> },
              { path: "promotions", element: <Promotions /> },
              { path: "analytics", element: <Analytics /> },
              { path: "shop", element: <ShopSettings /> },
              { path: "qrcode", element: <QrCode /> },
              { path: "billing", element: <Billing /> },
              { path: "support", element: <Support /> },
              { path: "settings", element: <Settings /> },
            ],
          },
        ],
      },

      // Boutique publique (slug optionnel — défaut = VITE_STORE_SLUG)
      {
        path: "/store",
        element: <StoreLayout />,
        children: [
          { index: true, element: <StoreHome /> },
          { path: "menu", element: <StoreMenu /> },
          { path: "product/:id", element: <ProductDetails /> },
          { path: "cart", element: <Cart /> },
          { path: "checkout", element: <Checkout /> },
          { path: "confirmation", element: <OrderConfirmation /> },
          { path: "track", element: <OrderTracking /> },
        ],
      },
      {
        path: "/store/:slug",
        element: <StoreLayout />,
        children: [
          { index: true, element: <StoreHome /> },
          { path: "menu", element: <StoreMenu /> },
          { path: "product/:id", element: <ProductDetails /> },
          { path: "cart", element: <Cart /> },
          { path: "checkout", element: <Checkout /> },
          { path: "confirmation", element: <OrderConfirmation /> },
          { path: "track", element: <OrderTracking /> },
        ],
      },

      // Super Admin
      {
        element: <ProtectedRoute roles={["super_admin"]} />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: "restaurants", element: <AdminRestaurants /> },
              { path: "restaurants/:id", element: <AdminRestaurantDetails /> },
              { path: "subscriptions", element: <AdminSubscriptions /> },
              { path: "payments", element: <AdminPayments /> },
              { path: "users", element: <AdminUsers /> },
              { path: "orders", element: <AdminOrders /> },
              { path: "analytics", element: <AdminAnalytics /> },
              { path: "support", element: <AdminSupport /> },
              { path: "settings", element: <AdminSettings /> },
            ],
          },
        ],
      },

      // 404 — route catch-all
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
