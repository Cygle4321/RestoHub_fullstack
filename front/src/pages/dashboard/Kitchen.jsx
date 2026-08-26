import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChefHat,
  RefreshCw,
  Clock,
  Bike,
  ShoppingBag,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { Badge, Button, Spinner, useToast } from "../../components/ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import { restaurantApi } from "../../api/restaurant";
import { orderStatusToApi } from "../../lib/mappers";

/**
 * Écran Cuisine (KDS) — plein écran, gros boutons, auto-refresh 10 s.
 * Colonnes : Nouvelles → Confirmées → En préparation → Prêtes.
 */
const COLUMNS = [
  { key: "nouvelle", label: "Nouvelles", next: "Confirmée", accent: "#f59e0b" },
  { key: "confirmee", label: "Confirmées", next: "En préparation", accent: "#0ea5e9" },
  { key: "en_preparation", label: "En préparation", next: "Prête", accent: "#8b5cf6" },
  { key: "prete", label: "Prêtes", next: null, accent: "#10b981" },
];

export default function Kitchen() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [, forceTick] = useState(0);
  const timerRef = useRef(null);

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
    timerRef.current = setInterval(() => {
      if (!document.hidden) load(true);
    }, 10000);
    const onVisible = () => {
      if (!document.hidden) load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Horloge des compteurs de temps (re-render chaque minute)
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

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

  const statusKey = (label) => orderStatusToApi(label);

  const minutesSince = (iso) => {
    if (!iso) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  };

  const byStatus = (key) =>
    orders
      .filter((o) => statusKey(o.status) === key)
      .sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));

  if (loading) return <Spinner label="Chargement de l'écran cuisine…" />;

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      {/* Barre de contrôle */}
      <div className="sticky top-[60px] z-10 flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <span className="flex items-center gap-2 text-lg font-black tracking-tight text-zinc-900">
          <ChefHat size={22} className="text-primary-500" /> Cuisine
        </span>
        <Badge variant="primary">{orders.filter((o) => ["nouvelle", "confirmee", "en_preparation", "prete"].includes(statusKey(o.status))).length} en cours</Badge>
        <span className="hidden text-xs text-zinc-400 sm:inline">
          {lastSync ? `Mis à jour à ${lastSync.toLocaleTimeString("fr-FR")}` : ""}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" onClick={() => load()} disabled={refreshing} className="px-3 py-2">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 gap-3 bg-zinc-100 p-3 md:grid-cols-2 xl:grid-cols-4 xl:p-4">
        {COLUMNS.map((col) => {
          const list = byStatus(col.key);
          return (
            <div key={col.key} className="flex min-h-[300px] flex-col rounded-2xl bg-zinc-50 p-2 ring-1 ring-zinc-200/70">
              <div className="mb-2 flex items-center gap-2 px-1.5 py-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.accent }} />
                <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-700">{col.label}</h3>
                <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white" style={{ backgroundColor: col.accent }}>
                  {list.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                {list.length === 0 && (
                  <p className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400">
                    Aucune commande
                  </p>
                )}

                {list.map((o) => {
                  const mins = minutesSince(o.created_at);
                  const urgent = mins >= 20;
                  const warn = mins >= 10 && !urgent;
                  return (
                    <article
                      key={o._id || o.id}
                      className={`rounded-xl border-l-4 bg-white p-3 shadow-sm transition hover:shadow-md ${
                        urgent ? "ring-2 ring-danger-300" : warn ? "ring-1 ring-amber-200" : ""
                      }`}
                      style={{ borderLeftColor: col.accent }}
                    >
                      <header className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-base font-black tracking-tight text-zinc-900">{o.number}</p>
                          <p className="text-[11px] font-medium text-zinc-500">{o.customer?.name}</p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            urgent ? "bg-danger-50 text-danger-600" : warn ? "bg-amber-50 text-amber-600" : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          <Clock size={11} /> {mins} min
                        </span>
                      </header>

                      <ul className="mt-2 space-y-1">
                        {(o.items || []).map((it, i) => (
                          <li key={`${o.number}-${i}`} className="rounded-lg bg-zinc-50 px-2 py-1.5">
                            <p className="text-sm font-bold text-zinc-900">
                              <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary-100 text-[11px] font-black text-primary-700">
                                {it.qty}
                              </span>
                              {it.name}
                            </p>
                            {(it.options?.length > 0 || it.supplements?.length > 0) && (
                              <p className="mt-0.5 pl-7 text-[11px] leading-snug text-zinc-500">
                                {[
                                  ...(it.options || []).map((op) => `${op.name}: ${op.choice}`),
                                  ...(it.supplements || []).map((s) => `+${s.name}`),
                                ].join(" · ")}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>

                      <footer className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5">
                          {String(o.mode).toLowerCase() === "livraison" ? <Bike size={11} /> : <ShoppingBag size={11} />}
                          {o.mode}
                        </span>
                        <button
                          title={`WhatsApp ${o.customer?.phone || ""}`}
                          onClick={() =>
                            window.open(
                              (() => {
                                let d = String(o.customer?.phone || "").replace(/\D+/g, "");
                                if (d.startsWith("0")) d = `229${d.slice(1)}`;
                                else if (!d.startsWith("229")) d = `229${d}`;
                                const txt = encodeURIComponent(`Bonjour ${o.customer?.name || ""} ! Au sujet de votre commande ${o.number} : `);
                                return `https://wa.me/${d}?text=${txt}`;
                              })(),
                              "_blank",
                              "noopener"
                            )
                          }
                          className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600 transition hover:bg-emerald-100"
                        >
                          WhatsApp
                        </button>
                      </footer>

                      <div className="mt-2.5 flex gap-2">
                        {col.next ? (
                          <Button
                            onClick={() => advance(o)}
                            className="flex-1 justify-center py-2.5 text-sm"
                            style={{ backgroundColor: col.accent }}
                          >
                            {col.next} <ArrowRight size={15} />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => advance(o, String(o.mode).toLowerCase() === "livraison" ? "En livraison" : "Livrée")}
                            variant="success"
                            className="flex-1 justify-center py-2.5 text-sm"
                          >
                            {String(o.mode).toLowerCase() === "livraison" ? "En livraison" : "Livrée"} <ArrowRight size={15} />
                          </Button>
                        )}
                        <button
                          onClick={() => setCancelTarget(o)}
                          title="Annuler la commande"
                          className="rounded-xl border border-zinc-200 p-2 text-zinc-400 transition hover:bg-danger-50 hover:text-danger-500"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
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
    </div>
  );
}
