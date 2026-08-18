import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  Truck,
  Tag,
  BarChart3,
  Store,
  QrCode,
  CreditCard,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  Search,
  AlertCircle,
  CheckCheck,
  LifeBuoy,
} from "lucide-react";
import { Avatar } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import EmailVerificationBanner from "../components/EmailVerificationBanner";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { notificationApi } from "../api/notifications";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/dashboard/orders", icon: ShoppingCart, label: "Commandes" },
  { to: "/dashboard/products", icon: Package, label: "Produits" },
  { to: "/dashboard/categories", icon: FolderTree, label: "Catégories" },
  { to: "/dashboard/customers", icon: Users, label: "Clients" },
  { to: "/dashboard/delivery", icon: Truck, label: "Livraison" },
  { to: "/dashboard/promotions", icon: Tag, label: "Promotions" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "Statistiques" },
  { to: "/dashboard/shop", icon: Store, label: "Ma boutique" },
  { to: "/dashboard/qrcode", icon: QrCode, label: "QR Code" },
  { to: "/dashboard/billing", icon: CreditCard, label: "Abonnement" },
  { to: "/dashboard/support", icon: LifeBuoy, label: "Support" },
  { to: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, restaurant, logout } = useAuth();
  const navigate = useNavigate();
  const ownerName = user?.name || "Utilisateur";
  const restoName = restaurant?.name || user?.restaurant?.name || "Mon restaurant";

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationApi.list();
      const list = data.notifications || data.data || [];
      setNotifications(list);
      setUnreadCount(data.unread_count ?? list.filter((n) => !n.is_read).length);
    } catch {
      /* silencieux */
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 20000);
    return () => clearInterval(t);
  }, [loadNotifications]);

  const markAllRead = async () => {
    setNotifications((l) => l.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      /* silencieux */
    }
  };

  const markRead = async (id) => {
    setNotifications((l) => l.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.markRead(id);
    } catch {
      /* silencieux */
    }
  };

  const timeAgo = (iso) => {
    if (!iso) return "";
    const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `Il y a ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `Il y a ${h} h`;
    const d = Math.floor(h / 24);
    return d === 1 ? "Hier" : `Il y a ${d} jours`;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogoutClick = (e) => {
    e.preventDefault();
    setConfirmLogout(true);
  };

  const doLogout = async () => {
    setLoggingOut(true);
    await handleLogout();
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-zinc-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-zinc-200/80 bg-white transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[60px] items-center gap-3 border-b border-zinc-100 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
            <Store size={17} strokeWidth={2} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-bold tracking-tight text-zinc-900">RestoHub</p>
            <p className="text-[11px] font-medium text-zinc-400">Espace restaurant</p>
          </div>
          <button
            className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary-50 text-primary-700 shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.75}
                    className={isActive ? "text-primary-600" : "text-zinc-400 group-hover:text-zinc-600"}
                  />
                  {label}
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-zinc-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2.5">
            <Avatar name={ownerName} src={user?.avatar} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold text-zinc-900">{ownerName}</p>
              <p className="truncate text-[11px] text-zinc-400">{restoName}</p>
            </div>
            <button
              title="Déconnexion"
              onClick={onLogoutClick}
              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-danger-600"
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-[60px] items-center gap-4 border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              strokeWidth={1.75}
            />
            <input
              placeholder="Rechercher commandes, produits…"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 py-2 pl-9 pr-3 text-sm placeholder-zinc-400 transition focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/10"
            />
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <span
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold sm:inline-flex ${
                restaurant?.is_open ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${restaurant?.is_open ? "animate-pulse bg-success-500" : "bg-danger-500"}`} />
              {restaurant?.is_open ? "Boutique ouverte" : "Boutique fermée"}
            </span>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
              >
                <Bell size={18} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-zinc-100 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between px-2 pt-1">
                      <h3 className="text-sm font-bold text-zinc-900">Notifications</h3>
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        <CheckCheck size={13} /> Tout marquer comme lu
                      </button>
                    </div>
                    <div className="flex max-h-[300px] flex-col gap-1 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-2 py-8 text-center text-sm text-zinc-400">Aucune notification</p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={`flex w-full items-start gap-3 rounded-xl p-2 text-left transition hover:bg-zinc-50 ${n.is_read ? "opacity-60" : ""}`}
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.kind === "cancel" ? "bg-danger-50 text-danger-600" : n.kind === "support" ? "bg-primary-50 text-primary-600" : "bg-primary-50 text-primary-600"}`}>
                              {n.kind === "cancel" ? <AlertCircle size={14} /> : n.kind === "support" ? <LifeBuoy size={14} /> : <ShoppingCart size={14} />}
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-zinc-900">
                                {n.kind === "cancel" ? (
                                  <>Commande {n.data?.order_number || ""} annulée</>
                                ) : n.kind === "support" ? (
                                  <>Réponse du support — {n.data?.subject || "votre ticket"}</>
                                ) : (
                                  <>Nouvelle commande {n.data?.order_number || ""}</>
                                )}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {n.kind === "order" && n.data?.customer_name ? `${n.data.customer_name} · ` : ""}
                                {n.data?.total != null ? `${Number(n.data.total).toLocaleString("fr-FR")} FCFA` : ""}
                              </p>
                              <p className="mt-0.5 text-[11px] text-zinc-400">{timeAgo(n.created_at)}</p>
                            </div>
                            {!n.is_read && <span className="ml-auto mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <Avatar name={ownerName} src={user?.avatar} className="hidden sm:inline-flex" />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <EmailVerificationBanner />
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Se déconnecter"
        message="Voulez-vous vraiment vous déconnecter ?"
        confirmLabel="Se déconnecter"
        danger
        loading={loggingOut}
        onConfirm={doLogout}
        onClose={() => setConfirmLogout(false)}
      />
    </div>
  );
}
