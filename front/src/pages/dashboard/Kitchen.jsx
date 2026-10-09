import { useCallback, useEffect, useState } from "react";
import {
  ChefHat,
  RefreshCw,
  Clock,
  Bike,
  ShoppingBag,
  ArrowRight,
  XCircle,
  Maximize,
  Minimize,
  Ticket,
  Users,
  Printer,
  Tag,
  CheckCircle2,
  Package,
} from "lucide-react";
import { useToast } from "../../components/ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import { restaurantApi } from "../../api/restaurant";
import {
  orderStatusToApi,
  isGroupOrder,
  extractGroupCode,
  parseItemParticipant,
  getGroupOrderParticipants,
  groupOrderItemsByParticipant,
} from "../../lib/mappers";
import BoxLabelsModal from "../../components/common/BoxLabelsModal";
import { useAuth } from "../../context/AuthContext";

/**
 * Écran Cuisine (KDS) — cartes façon ticket de caisse
 * (même style que le récapitulatif du panier, en plus simple).
 * Colonnes : Nouvelles → Confirmées → En préparation → Prêtes.
 */

const COLUMNS = [
  { key: "nouvelle", label: "Nouvelles", next: "Confirmée", accent: "#f59e0b", soft: "rgba(245,158,11,.12)" },
  { key: "confirmee", label: "Confirmées", next: "En préparation", accent: "#0ea5e9", soft: "rgba(14,165,233,.12)" },
  { key: "en_preparation", label: "En préparation", next: "Prête", accent: "#8b5cf6", soft: "rgba(139,92,246,.12)" },
  { key: "prete", label: "Prêtes", next: null, accent: "#10b981", soft: "rgba(16,185,129,.12)" },
];

const WARN_MIN = 10;
const URGENT_MIN = 20;

/* Horloge live */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="hidden items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3 py-1 font-mono text-sm font-bold tabular-nums text-zinc-700 shadow-xs md:inline-flex">
      <Clock size={13} className="text-zinc-400" />
      {now.toLocaleTimeString("fr-FR")}
    </span>
  );
}

export default function Kitchen() {
  const toast = useToast();
  const { restaurant } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all"); // "all" | "group"
  const [packagingMode, setPackagingMode] = useState({}); // { [orderId]: boolean }
  const [packedBoxes, setPackedBoxes] = useState({}); // { [`${orderId}_${person}`]: boolean }
  const [labelOrder, setLabelOrder] = useState(null);
  const [, forceTick] = useState(0);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const res = await restaurantApi.orders({ per_page: 60 });
        setOrders(res.data || []);
        setLastSync(new Date());
      } catch {
        if (!silent) toast("Impossible de charger les commandes", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load(true);
    // Auto-refresh 10 s — en pause quand l'onglet est masqué
    const t = setInterval(() => {
      if (!document.hidden) load(true);
    }, 10000);
    const onVisible = () => {
      if (!document.hidden) load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Compteurs de temps des cartes
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  // État plein écran
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function minutesSince(iso) {
    if (!iso) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  }

  const statusKey = (label) => orderStatusToApi(label);

  const activeOrders = orders.filter((o) =>
    ["nouvelle", "confirmee", "en_preparation", "prete"].includes(statusKey(o.status))
  );

  const advance = async (order, forcedNext = null) => {
    const col = COLUMNS.find((c) => c.key === statusKey(order.status));
    const target = forcedNext || col?.next;
    if (!target) return;
    try {
      await restaurantApi.updateOrderStatus(order._id || order.id, target);
      await load(true);
    } catch (e) {
      toast(e?.message || "Changement de statut impossible", "error");
    }
  };

  const cancel = async () => {
    const target = cancelTarget;
    setCancelTarget(null);
    try {
      await restaurantApi.updateOrderStatus(target._id || target.id, "Annulée");
      toast(`Commande ${target.number} annulée`, "info");
      await load(true);
    } catch (e) {
      toast(e?.message || "Annulation impossible", "error");
    }
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.();
      }
    } catch {
      /* silencieux */
    }
  };

  const waOpen = (order) => {
    let d = String(order.customer?.phone || "").replace(/\D+/g, "");
    if (d.startsWith("0")) d = `229${d.slice(1)}`;
    else if (!d.startsWith("229")) d = `229${d}`;
    const txt = encodeURIComponent(
      `Bonjour ${order.customer?.name || ""} ! Au sujet de votre commande ${order.number} : `
    );
    window.open(`https://wa.me/${d}?text=${txt}`, "_blank", "noopener");
  };

  const groupOrdersCount = activeOrders.filter(isGroupOrder).length;

  const filteredOrders = activeOrders.filter((o) => {
    if (groupFilter === "group") return isGroupOrder(o);
    return true;
  });

  const byStatus = (key) =>
    filteredOrders
      .filter((o) => statusKey(o.status) === key)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  if (loading) {
    return (
      <div className="-m-4 flex min-h-[calc(100vh-60px)] flex-col items-center justify-center bg-[#f7f7f8] sm:-m-6 lg:-m-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/25">
          <ChefHat size={20} className="animate-pulse text-white" />
        </span>
        <p className="mt-4 text-sm font-medium text-zinc-500">Préparation de l'écran cuisine…</p>
      </div>
    );
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-60px)] bg-[#f4f4f5] pb-6 sm:-m-6 lg:-m-8">
      <style>{`
        @keyframes kdsIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .kds-card { animation: kdsIn .28s ease-out both; }
        @keyframes kdsPulse { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
        .kds-urgent { animation: kdsPulse 1.6s ease-in-out infinite; }
      `}</style>

      {/* Barre de contrôle */}
      <header className="sticky top-[60px] z-10 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm">
              <ChefHat size={18} strokeWidth={2} />
            </span>
            <span className="text-base font-black uppercase tracking-[.14em] text-zinc-900">Cuisine</span>
          </span>

          {/* Sélecteur Toutes / Commandes Groupées */}
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1">
            <button
              onClick={() => setGroupFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                groupFilter === "all"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Toutes ({activeOrders.length})
            </button>
            <button
              onClick={() => setGroupFilter("group")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                groupFilter === "group"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "text-primary-700 hover:bg-primary-50"
              }`}
            >
              <Users size={12} />
              <span>Groupées ({groupOrdersCount})</span>
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <LiveClock />
            {lastSync && (
              <span className="hidden text-[11px] font-medium text-zinc-400 lg:inline">
                sync {lastSync.toLocaleTimeString("fr-FR")}
              </span>
            )}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
            <button
              onClick={() => load()}
              title="Actualiser"
              className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile column selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none px-3 pt-3 md:hidden">
        <button
          onClick={() => setMobileTab("all")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
            mobileTab === "all"
              ? "bg-zinc-900 text-white shadow-xs"
              : "border border-zinc-200 bg-white text-zinc-600"
          }`}
        >
          Toutes ({activeOrders.length})
        </button>
        {COLUMNS.map((col) => {
          const count = byStatus(col.key).length;
          const isCurrent = mobileTab === col.key;
          return (
            <button
              key={col.key}
              onClick={() => setMobileTab(col.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                isCurrent
                  ? "text-white shadow-xs"
                  : "border border-zinc-200 bg-white text-zinc-600"
              }`}
              style={isCurrent ? { backgroundColor: col.accent } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: isCurrent ? "#ffffff" : col.accent }} />
              {col.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-4 xl:p-4">
        {COLUMNS.map((col) => {
          const list = byStatus(col.key);
          const isVisibleOnMobile = mobileTab === "all" || mobileTab === col.key;
          return (
            <section
              key={col.key}
              className={`max-h-[calc(100vh-150px)] min-h-[300px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50 ${
                isVisibleOnMobile ? "flex" : "hidden md:flex"
              }`}
            >
              {/* En-tête colonne */}
              <div
                className="flex items-center gap-2.5 border-b border-zinc-200/70 px-4 py-3"
                style={{ background: `linear-gradient(180deg, ${col.soft}, transparent)` }}
              >
                <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: col.accent }} />
                <h3 className="text-xs font-black uppercase tracking-[.14em] text-zinc-600">{col.label}</h3>
                <span
                  className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-black text-white shadow-sm"
                  style={{ backgroundColor: col.accent }}
                >
                  {list.length}
                </span>
              </div>

              {/* Tickets */}
              <div className="kds-scroll flex-1 space-y-3 overflow-y-auto p-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                {list.length === 0 && (
                  <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-white/60 py-10 text-center">
                    <Ticket size={22} className="mx-auto mb-2 rotate-[-8deg] text-zinc-300" />
                    <p className="text-xs font-medium text-zinc-400">Aucun ticket</p>
                  </div>
                )}

                {list.map((o, idx) => {
                  const mins = minutesSince(o.created_at);
                  const urgent = mins >= URGENT_MIN;
                  const warn = mins >= WARN_MIN && !urgent;
                  const isDelivery = String(o.mode).toLowerCase() === "livraison";
                  const orderId = o._id || o.id;
                  const isGroup = isGroupOrder(o);
                  const groupCode = extractGroupCode(o);
                  const participants = getGroupOrderParticipants(o);
                  const { grouped, ungrouped } = groupOrderItemsByParticipant(o.items || []);
                  const isPackaging = Boolean(packagingMode[orderId]);

                  return (
                    <article
                      key={orderId}
                      className={`kds-card overflow-hidden rounded-lg bg-white shadow-sm ring-1 transition duration-200 hover:shadow-md ${
                        urgent ? "ring-danger-300" : warn ? "ring-amber-300" : "ring-zinc-200/80"
                      }`}
                      style={{ animationDelay: `${Math.min(idx * 60, 360)}ms` }}
                    >
                      {/* Bandeau du ticket (perforé comme le panier) */}
                      <div className="relative h-8 shrink-0" style={{ backgroundColor: col.accent }}>
                        <span className="absolute -left-2.5 top-5 h-5 w-5 rounded-full bg-zinc-50" />
                        <span className="absolute -right-2.5 top-5 h-5 w-5 rounded-full bg-zinc-50" />
                        <span className="absolute inset-0 flex items-center justify-center gap-1.5 font-mono text-xs font-black uppercase tracking-[0.18em] text-white">
                          <Ticket size={13} /> {o.number}
                        </span>
                      </div>

                      {/* Badge Commande Groupée Bureau */}
                      {isGroup && (
                        <div className="bg-gradient-to-r from-primary-950 to-zinc-900 px-3 py-1.5 text-white flex items-center justify-between text-[11px] font-bold border-b border-primary-500/20">
                          <span className="flex items-center gap-1.5 text-primary-300">
                            <Users size={12} />
                            <span>Commande Groupée</span>
                          </span>
                          <span className="rounded bg-primary-500/30 px-1.5 py-0.5 font-mono text-[10px] text-primary-200">
                            {groupCode || "GROUPE"}
                          </span>
                        </div>
                      )}

                      {/* Client + chrono */}
                      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
                        <p className="min-w-0 truncate text-xs font-semibold text-zinc-600">
                          {o.customer?.name || "Client"}
                        </p>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-black tabular-nums ${
                            urgent
                              ? "kds-urgent bg-danger-50 text-danger-600"
                              : warn
                                ? "bg-amber-50 text-amber-600"
                                : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          <Clock size={10} />
                          {mins < 1 ? "< 1′" : `${mins}′`}
                        </span>
                      </div>

                      {/* Barre d'outils Commande Groupée : Cuisson / Boîtes / Étiquettes */}
                      {isGroup && (
                        <div className="mx-3 mt-2 flex items-center justify-between rounded-lg border border-primary-200/60 bg-primary-50/50 p-1 text-[11px]">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPackagingMode((prev) => ({ ...prev, [orderId]: false }))}
                              className={`rounded px-2 py-0.5 font-bold transition ${
                                !isPackaging
                                  ? "bg-white text-zinc-900 shadow-xs"
                                  : "text-zinc-500 hover:text-zinc-900"
                              }`}
                            >
                              Cuisson ({o.items?.length || 0})
                            </button>
                            <button
                              type="button"
                              onClick={() => setPackagingMode((prev) => ({ ...prev, [orderId]: true }))}
                              className={`rounded px-2 py-0.5 font-bold transition flex items-center gap-1 ${
                                isPackaging
                                  ? "bg-primary-600 text-white shadow-xs"
                                  : "text-primary-700 hover:bg-primary-100"
                              }`}
                            >
                              <Package size={12} />
                              <span>Boîtes ({participants.length || 1})</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLabelOrder(o)}
                            title="Imprimer les étiquettes pour les boîtes repas"
                            className="inline-flex items-center gap-1 rounded border border-primary-200 bg-white px-2 py-0.5 font-bold text-primary-900 shadow-xs hover:bg-primary-50 transition"
                          >
                            <Tag size={11} className="text-primary-600" />
                            <span>Étiquettes</span>
                          </button>
                        </div>
                      )}

                      {/* Articles : Mode Emballage par Prénom OU Mode Cuisson Standard */}
                      {isGroup && isPackaging ? (
                        <div className="space-y-2 px-3 py-2">
                          {Object.entries(grouped).map(([person, pItems]) => {
                            const boxKey = `${orderId}_${person}`;
                            const isPacked = Boolean(packedBoxes[boxKey]);
                            return (
                              <div
                                key={person}
                                className={`rounded-xl border p-2 text-xs transition ${
                                  isPacked
                                    ? "border-emerald-200 bg-emerald-50/70"
                                    : "border-zinc-200 bg-zinc-50/80"
                                }`}
                              >
                                <label className="flex items-center justify-between cursor-pointer border-b border-zinc-200/50 pb-1 mb-1 font-bold">
                                  <span className="flex items-center gap-1.5">
                                    <input
                                      type="checkbox"
                                      checked={isPacked}
                                      onChange={() =>
                                        setPackedBoxes((prev) => ({
                                          ...prev,
                                          [boxKey]: !prev[boxKey],
                                        }))
                                      }
                                      className="h-3.5 w-3.5 rounded accent-emerald-600"
                                    />
                                    <span className={`inline-flex items-center gap-1 ${isPacked ? "line-through text-emerald-800" : "text-zinc-900"}`}>
                                      <Package size={12} className="text-zinc-500" />
                                      <span>Boîte : {person}</span>
                                    </span>
                                  </span>
                                  {isPacked && <span className="text-[10px] text-emerald-600 font-bold">Prête ✓</span>}
                                </label>
                                <ul className="space-y-1 pl-5 text-[11px]">
                                  {pItems.map((it, i) => (
                                    <li key={i} className="text-zinc-700">
                                      <span className="font-bold">{it.qty}×</span> {it.cleanName}
                                      {((it.options?.length || 0) > 0 || (it.supplements?.length || 0) > 0) && (
                                        <span className="block text-[10px] text-zinc-400">
                                          {[
                                            ...(it.options || []).map((op) => op.choice ? `${op.name}: ${op.choice}` : op.name),
                                            ...(it.supplements || []).map((s) => `+ ${s.name}`),
                                          ].join(" · ")}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                          {ungrouped.length > 0 && (
                            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-2 text-xs">
                              <p className="font-bold text-zinc-700 mb-1">Partagé / Commun :</p>
                              <ul className="space-y-0.5 pl-2 text-[11px] text-zinc-600">
                                {ungrouped.map((it, i) => (
                                  <li key={i}>{it.qty}× {it.cleanName}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <ul className="space-y-1 px-3 pb-2 pt-2">
                          {(o.items || []).map((it, i) => {
                            const { cleanName, participant } = parseItemParticipant(it.name);
                            return (
                              <li key={`${o.number}-${i}`}>
                                <div className="flex items-start justify-between gap-1 text-sm leading-snug">
                                  <p className="text-zinc-800">
                                    <span className="font-black text-zinc-900">{it.qty}×</span>{" "}
                                    <span className="font-semibold">{cleanName}</span>
                                  </p>
                                  {participant && (
                                    <span className="shrink-0 rounded-md bg-primary-50 text-primary-700 font-bold px-1.5 py-0.5 text-[10px] ring-1 ring-inset ring-primary-200/80">
                                      {participant}
                                    </span>
                                  )}
                                </div>
                                {((it.options?.length || 0) > 0 || (it.supplements?.length || 0) > 0) && (
                                  <p className="ml-6 mt-0.5 text-[11px] leading-snug text-zinc-500">
                                    {[
                                      ...(it.options || []).map((op) => op.choice ? `${op.name}: ${op.choice}` : op.name),
                                      ...(it.supplements || []).map((s) => `+ ${s.name}`),
                                    ].join(" · ")}
                                  </p>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Note de commande si existante */}
                      {o.notes && (
                        <div className="mx-3 my-1 rounded-lg bg-amber-50/80 border border-amber-200/80 p-2 text-[11px] text-amber-900 leading-snug">
                          <span className="font-bold">Note : </span>
                          <span>{o.notes}</span>
                        </div>
                      )}

                      {/* Mode + WhatsApp */}
                      <div className="mx-3 flex items-center gap-1.5 border-t border-dashed border-zinc-200 pt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500">
                          {isDelivery ? <Bike size={11} /> : <ShoppingBag size={11} />}
                          {isDelivery ? "Livraison" : "Retrait"}
                        </span>
                        {isDelivery && o.address && o.address !== "—" && (
                          <span className="min-w-0 truncate text-[11px] text-zinc-400">· {o.address}</span>
                        )}
                        <button
                          onClick={() => waOpen(o)}
                          title={`WhatsApp ${o.customer?.phone || ""}`}
                          className="ml-auto inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold text-emerald-600 transition hover:bg-emerald-50"
                        >
                          WhatsApp
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 p-2.5">
                        {col.next ? (
                          <button
                            onClick={() => advance(o)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-black text-white shadow-sm transition hover:brightness-110 active:scale-[.98]"
                            style={{ backgroundColor: col.accent }}
                          >
                            {col.next}
                            <ArrowRight size={15} strokeWidth={2.75} />
                          </button>
                        ) : (
                          <button
                            onClick={() => advance(o, isDelivery ? "En livraison" : "Livrée")}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-400 active:scale-[.98]"
                          >
                            {isDelivery ? "En livraison" : "Livrée"}
                            <ArrowRight size={15} strokeWidth={2.75} />
                          </button>
                        )}
                        <button
                          onClick={() => setCancelTarget(o)}
                          title="Annuler la commande"
                          className="rounded-lg border border-zinc-200 px-2.5 text-zinc-400 transition hover:border-danger-200 hover:bg-danger-50 hover:text-danger-500"
                        >
                          <XCircle size={17} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        title={`Annuler ${cancelTarget?.number || ""}`}
        message="Cette commande sera marquée comme annulée et disparaîtra de l'écran cuisine."
        confirmLabel="Annuler la commande"
        danger
        onConfirm={cancel}
        onClose={() => setCancelTarget(null)}
      />

      <BoxLabelsModal
        open={Boolean(labelOrder)}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
        restaurantName={restaurant?.name}
      />
    </div>
  );
}
