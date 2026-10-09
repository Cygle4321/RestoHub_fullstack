import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Repeat,
  CreditCard,
  Users,
  ShoppingCart,
  BarChart3,
  LifeBuoy,
  Settings,
  Menu,
  X,
  Bell,
  ShieldCheck,
  LogOut,
  CheckCheck,
} from "lucide-react";
import { Avatar } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import EmailVerificationBanner from "../components/EmailVerificationBanner";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import { notificationApi } from "../api/notifications";
import SEO from "../components/common/SEO";

const nav = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/restaurants", icon: Building2, label: "Restaurants" },
  { to: "/admin/subscriptions", icon: Repeat, label: "Abonnements" },
  { to: "/admin/payments", icon: CreditCard, label: "Paiements" },
  { to: "/admin/users", icon: Users, label: "Utilisateurs" },
  { to: "/admin/orders", icon: ShoppingCart, label: "Commandes" },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/admin/support", icon: LifeBuoy, label: "Support" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    // Polling intelligent : en pause quand l'onglet est masqué
    const t = setInterval(() => {
      if (!document.hidden) loadNotifications();
    }, 20000);
    const onVisible = () => {
      if (!document.hidden) loadNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
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

  const notifMeta = (n) => {
    const kind = n.kind || n.data?.kind || "info";
    if (kind === "restaurant")
      return { icon: Building2, text: "Nouveau restaurant inscrit", sub: n.data?.restaurant_name || "" };
    if (kind === "support_ticket")
      return { icon: LifeBuoy, text: "Nouveau ticket de support", sub: n.data?.subject || "" };
    if (kind === "subscription")
      return { icon: CreditCard, text: "Nouvel abonnement", sub: `${n.data?.restaurant_name || ""} · ${n.data?.plan_name || ""}` };
    return { icon: Bell, text: "Notification", sub: "" };
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
    <div className="min-h-screen bg-[#f4f4f5]">
      <SEO title="Administration Globale" noindex />
      {open && (
        <div
          className="fixed inset-0 z-30 bg-zinc-900/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-zinc-950 transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[60px] items-center gap-3 border-b border-white/5 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-900 shadow-sm">
            <ShieldCheck size={17} strokeWidth={2} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-bold tracking-tight text-white">RestoHub</p>
            <p className="text-[11px] font-medium text-zinc-500">Super Admin</p>
          </div>
          <button
            className="ml-auto rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

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
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.75}
                    className={isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}
                  />
                  {label}
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2.5">
            <Avatar name={user?.name || "Admin Platform"} className="bg-white/10 text-white" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold text-white">{user?.name || "Admin"}</p>
              <p className="truncate text-[11px] text-zinc-500">{user?.email || "admin@restohub.com"}</p>
            </div>
            <button
              title="Se déconnecter"
              onClick={onLogoutClick}
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 max-w-full lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[60px] items-center gap-4 border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <p className="min-w-0 truncate text-[13px] font-semibold text-zinc-500">
            Administration de la plateforme
          </p>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
              >
                <Bell size={18} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-100 bg-white p-3 shadow-xl">
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
                        notifications.map((n) => {
                          const meta = notifMeta(n);
                          const Icon = meta.icon;
                          return (
                            <button
                              key={n.id}
                              onClick={() => markRead(n.id)}
                              className={`flex w-full items-start gap-3 rounded-xl p-2 text-left transition hover:bg-zinc-50 ${n.is_read ? "opacity-60" : ""}`}
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                                <Icon size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-zinc-900">{meta.text}</p>
                                {meta.sub && <p className="truncate text-xs text-zinc-500">{meta.sub}</p>}
                                <p className="mt-0.5 text-[11px] text-zinc-400">{timeAgo(n.created_at)}</p>
                              </div>
                              {!n.is_read && <span className="ml-auto mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <Avatar name={user?.name || "Admin Platform"} className="hidden sm:inline-flex" />
            <button
              title="Se déconnecter"
              onClick={onLogoutClick}
              className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <LogOut size={18} strokeWidth={1.75} />
            </button>
          </div>
        </header>
        <main className="min-w-0 max-w-full p-4 sm:p-6 lg:p-8">
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
