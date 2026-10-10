import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Clock, MapPin, Search, Menu as MenuIcon, X, Phone, Store } from "lucide-react";
import { EmptyState } from "../components/ui";
import { StoreProvider, useStore, initialsOf } from "../store/StoreContext";
import { useCart } from "../store/CartContext";
import { waLink } from "../lib/whatsapp";
import GroupOrderModal from "../components/common/GroupOrderModal";

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
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  const hideStickyCart =
    location.pathname.endsWith("/cart") ||
    location.pathname.endsWith("/checkout") ||
    location.pathname.includes("/product/") ||
    location.pathname.includes("/group") ||
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
              <Link
                to={`/store/${slug}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 md:py-1.5"
              >
                Accueil
              </Link>
              <Link
                to={`/store/${slug}/menu`}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 md:py-1.5"
              >
                Menu
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setGroupModalOpen(true);
                }}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 md:py-1.5 text-left cursor-pointer"
              >
                Commande groupée
              </button>
              <Link
                to={`/store/${slug}/track`}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 md:py-1.5"
              >
                Suivre
              </Link>
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

      {/* Floating WhatsApp Quick Contact Button (masqué sur la page de commande groupée qui a ses propres boutons) */}
      {!location.pathname.includes("/group") && restaurant?.phone && (
        <a
          href={waLink(restaurant.phone, `Bonjour *${restaurant.name || "Restaurant"}* ! J'aimerais avoir des informations sur votre menu 🍲`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed ${hideStickyCart ? "bottom-4" : "bottom-20 md:bottom-6"} right-4 z-40 flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 text-xs font-bold ring-2 ring-white/80`}
          title="Poser une question sur WhatsApp"
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91A9.85 9.85 0 0 0 12.04 2Zm5.8 14.03c-.24.68-1.42 1.3-1.96 1.35-.5.05-.98.23-2.78-.58a10.4 10.4 0 0 1-4.28-3.77c-.31-.46-.53-1-.75-1.54-.22-.55-.33-1.07-.35-1.6-.02-.52.36-1.13.62-1.44.26-.31.57-.39.76-.4h.55c.18 0 .41-.06.63.48.23.56.79 1.94.86 2.08.07.14.11.3.02.49-.09.19-.19.34-.37.53-.18.19-.28.28-.4.48-.12.2-.02.4.09.58.11.19.61.99 1.3 1.6.89.79 1.63 1.04 1.87 1.16.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.59-.18 1.27Z"/>
            </svg>
          </span>
          <span className="hidden sm:inline">Discuter sur WhatsApp</span>
        </a>
      )}

      {/* Modal Commande Groupée accessible globalement */}
      <GroupOrderModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        slug={slug}
      />

      {/* Cart Sidebar */}
    </div>
  );
}
