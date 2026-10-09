import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Clock, MapPin, Search, Menu as MenuIcon, X, Phone, Store } from "lucide-react";
import { EmptyState } from "../components/ui";
import { StoreProvider, useStore, initialsOf } from "../store/StoreContext";
import { useCart } from "../store/CartContext";

export default function StoreLayout() {
  return (
    <StoreProvider>
      <StoreLayoutInner />
    </StoreProvider>
  );
}

function StoreLayoutInner() {
  const { items } = useCart();
  const { slug, error, restaurant, todayHours } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const count = items.reduce((s, x) => s + x.qty, 0);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const hideStickyCart =
    location.pathname.endsWith("/cart") ||
    location.pathname.endsWith("/checkout") ||
    location.pathname.includes("/product/") ||
    location.pathname.endsWith("/confirmation");

  const openLabel = !restaurant ? "…" : restaurant.is_open ? "Ouvert aujourd'hui" : "Fermé";
  const hours = todayHours ? `${openLabel} · ${todayHours}` : openLabel;
  const accent = restaurant?.color || "#14b8a6";

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/store/${slug}/menu?q=${encodeURIComponent(query.trim())}`);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-6">
        <EmptyState icon={Store} title="Restaurant introuvable" description={error} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] pb-24 md:pb-0">
      {/* Top utility bar — desktop */}
      <div className="hidden items-center justify-between bg-zinc-900 px-5 py-2 text-[11px] text-zinc-400 md:flex">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} strokeWidth={2} /> {hours}
        </span>
        <span className="inline-flex items-center gap-4">
          {restaurant?.address && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={12} strokeWidth={2} /> {restaurant.address}
            </span>
          )}
          {restaurant?.phone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone size={12} strokeWidth={2} /> {restaurant.phone}
            </span>
          )}
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <button
            className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>

          <Link to={`/store/${slug}`} className="flex items-center gap-2.5">
            {restaurant?.logo ? (
              <img
                src={restaurant.logo}
                alt={`Logo ${restaurant.name}`}
                className="h-10 w-10 rounded-2xl bg-zinc-100 object-cover shadow-sm"
              />
            ) : (
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: accent }}
              >
                {initialsOf(restaurant?.name)}
              </span>
            )}
            <div className="leading-tight min-w-0 max-w-[130px] sm:max-w-none">
              <p className="truncate text-sm font-bold tracking-tight text-zinc-900">{restaurant?.name || "…"}</p>
              {restaurant?.description && (
                <p className="hidden line-clamp-1 text-[11px] text-zinc-400 sm:block">{restaurant.description}</p>
              )}
            </div>
          </Link>

          {/* Mobile menu backdrop overlay */}
          {menuOpen && (
            <div
              className="fixed inset-0 top-16 z-10 bg-zinc-900/30 backdrop-blur-[1px] md:hidden"
              onClick={() => setMenuOpen(false)}
            />
          )}

          {/* Desktop nav */}
          <nav
            className={`absolute left-0 top-16 z-20 w-full border-b border-zinc-100 bg-white p-3 shadow-lg md:static md:z-auto md:flex md:w-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none ${
              menuOpen ? "block" : "hidden md:flex"
            }`}
          >
            <div className="flex flex-col gap-0.5 md:ml-8 md:flex-row md:items-center md:gap-1">
              {[
                { to: `/store/${slug}`, label: "Accueil" },
                { to: `/store/${slug}/menu`, label: "Menu" },
                { to: `/store/${slug}/track`, label: "Suivre" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 md:py-1.5"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-[220px] flex-1 lg:block">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              strokeWidth={1.75}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un plat…"
              className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm placeholder-zinc-400 transition focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/10"
            />
          </form>

          <button
            onClick={() => navigate(`/store/${slug}/cart`)}
            className="relative ml-auto flex items-center gap-2 rounded-full bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 md:ml-0"
          >
            <ShoppingBag size={16} strokeWidth={2} />
            <span className="hidden sm:inline">Panier</span>
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-primary-600">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200/80 bg-white px-4 py-10">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold text-zinc-900">{restaurant?.name || "…"}</p>
          {restaurant?.address && (
            <p className="mt-1.5 text-sm text-zinc-500">
              {restaurant.address}
              {restaurant?.phone ? ` · ${restaurant.phone}` : ""}
            </p>
          )}
          <p className="mt-4 text-xs text-zinc-400">
            Propulsé par{" "}
            <span className="font-semibold text-primary-600">RestoHub</span> — Digitalisez votre restaurant en ligne
          </p>
        </div>
      </footer>

      {/* Mobile sticky cart bar */}
      {count > 0 && !hideStickyCart && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3 md:hidden">
          <button
            onClick={() => navigate(`/store/${slug}/cart`)}
            className="flex w-full items-center justify-between rounded-2xl bg-zinc-900 px-5 py-4 text-white shadow-float transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-xs font-bold">
                {count}
              </span>
              Voir le panier
            </span>
            <span className="text-sm font-bold text-primary-400">Continuer →</span>
          </button>
        </div>
      )}

      {/* Cart Sidebar */}
    </div>
  );
}
