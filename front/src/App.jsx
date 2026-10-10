import { createBrowserRouter, RouterProvider, Outlet, Navigate, useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ToastProvider, Spinner } from "./components/ui";
import { CartProvider } from "./store/CartContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RootErrorBoundary from "./components/common/RootErrorBoundary";

// Helper sécurisé : rechargement automatique en cas de nouvelle version déployée sur le serveur
function lazyRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const isChunkError =
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("Importing a module script failed") ||
        error?.name === "ChunkLoadError";

      if (isChunkError) {
        const key = "restohub_retry_" + window.location.pathname;
        const retried = sessionStorage.getItem(key);
        if (!retried) {
          sessionStorage.setItem(key, "true");
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw error;
    }
  });
}

const DashboardLayout = lazyRetry(() => import("./layouts/DashboardLayout"));
const AdminLayout = lazyRetry(() => import("./layouts/AdminLayout"));
const StoreLayout = lazyRetry(() => import("./layouts/StoreLayout"));

const Landing = lazyRetry(() => import("./pages/public/Landing"));
const Login = lazyRetry(() => import("./pages/public/Login"));
const Register = lazyRetry(() => import("./pages/public/Register"));
const ForgotPassword = lazyRetry(() => import("./pages/public/ForgotPassword"));
const ResetPassword = lazyRetry(() => import("./pages/public/ResetPassword"));
const EmailVerified = lazyRetry(() => import("./pages/public/EmailVerified"));
const Terms = lazyRetry(() => import("./pages/public/Terms"));
const Privacy = lazyRetry(() => import("./pages/public/Privacy"));
const Onboarding = lazyRetry(() => import("./pages/onboarding/Onboarding"));

const DashboardHome = lazyRetry(() => import("./pages/dashboard/DashboardHome"));
const Orders = lazyRetry(() => import("./pages/dashboard/Orders"));
const Kitchen = lazyRetry(() => import("./pages/dashboard/Kitchen"));
const OrderDetails = lazyRetry(() => import("./pages/dashboard/OrderDetails"));
const Products = lazyRetry(() => import("./pages/dashboard/Products"));
const ProductForm = lazyRetry(() => import("./pages/dashboard/ProductForm"));
const Categories = lazyRetry(() => import("./pages/dashboard/Categories"));
const Customers = lazyRetry(() => import("./pages/dashboard/Customers"));
const CustomerDetails = lazyRetry(() => import("./pages/dashboard/CustomerDetails"));
const Delivery = lazyRetry(() => import("./pages/dashboard/Delivery"));
const Promotions = lazyRetry(() => import("./pages/dashboard/Promotions"));
const Analytics = lazyRetry(() => import("./pages/dashboard/Analytics"));
const ShopSettings = lazyRetry(() => import("./pages/dashboard/ShopSettings"));
const QrCode = lazyRetry(() => import("./pages/dashboard/QrCode"));
const Billing = lazyRetry(() => import("./pages/dashboard/Billing"));
const Settings = lazyRetry(() => import("./pages/dashboard/Settings"));
const Support = lazyRetry(() => import("./pages/dashboard/Support"));

const StoreHome = lazyRetry(() => import("./pages/store/StoreHome"));
const StoreMenu = lazyRetry(() => import("./pages/store/StoreMenu"));
const ProductDetails = lazyRetry(() => import("./pages/store/ProductDetails"));
const Cart = lazyRetry(() => import("./pages/store/Cart"));
const Checkout = lazyRetry(() => import("./pages/store/Checkout"));
const OrderConfirmation = lazyRetry(() => import("./pages/store/OrderConfirmation"));
const OrderTracking = lazyRetry(() => import("./pages/store/OrderTracking"));
const GroupOrder = lazyRetry(() => import("./pages/store/GroupOrder"));

const AdminDashboard = lazyRetry(() => import("./pages/admin/AdminDashboard"));
const AdminRestaurants = lazyRetry(() => import("./pages/admin/AdminRestaurants"));
const AdminRestaurantDetails = lazyRetry(() => import("./pages/admin/AdminRestaurantDetails"));
const AdminSubscriptions = lazyRetry(() => import("./pages/admin/AdminSubscriptions"));
const AdminPayments = lazyRetry(() => import("./pages/admin/AdminPayments"));
const AdminUsers = lazyRetry(() => import("./pages/admin/AdminUsers"));
const AdminOrders = lazyRetry(() => import("./pages/admin/AdminOrders"));
const AdminAnalytics = lazyRetry(() => import("./pages/admin/AdminAnalytics"));
const AdminSupport = lazyRetry(() => import("./pages/admin/AdminSupport"));
const AdminSettings = lazyRetry(() => import("./pages/admin/AdminSettings"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));

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

function RedirectGroup() {
  const { code } = useParams();
  return <Navigate to={code ? `/store/group/${code}` : "/store/group"} replace />;
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RootErrorBoundary />,
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
      { path: "/group", element: <RedirectGroup /> },
      { path: "/group/:code", element: <RedirectGroup /> },

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
          { path: "group", element: <GroupOrder /> },
          { path: "group/:code", element: <GroupOrder /> },
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
          { path: "group", element: <GroupOrder /> },
          { path: "group/:code", element: <GroupOrder /> },
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
