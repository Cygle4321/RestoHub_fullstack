import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Inbox, RefreshCw } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SearchInput,
  Select,
  Spinner,
  Table,
  Tabs,
  Td,
  statusVariant,
  useToast,
  PageHeader,
} from "../../components/ui";
import { restaurantApi } from "../../api/restaurant";
import { fmt, orderStatusToApi } from "../../lib/mappers";
import { waLink, orderWaText } from "../../lib/whatsapp";

const orderStatuses = ["Nouvelle", "Confirmée", "En préparation", "Prête", "En livraison", "Livrée", "Annulée"];

const MODE_TO_API = { Livraison: "livraison", Retrait: "retrait" };

export default function Orders() {
  const toast = useToast();
  const [status, setStatus] = useState("Toutes");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("Tous");
  const [date, setDate] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [total, setTotal] = useState(0);

  const loadOrders = useCallback(async () => {
    try {
      const data = await restaurantApi.orders({
        status: status === "Toutes" ? undefined : status,
        mode: MODE_TO_API[mode],
        q: query || undefined,
        date: date || undefined,
        per_page: 200,
      });
      const list = data.data || data || [];
      setOrders(Array.isArray(list) ? list : []);
      setTotal(data.total ?? (Array.isArray(list) ? list.length : 0));
    } catch {
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status, mode, query, date]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Auto-refresh : les nouvelles commandes apparaissent sans recharger la page.
  useEffect(() => {
    const id = setInterval(() => loadOrders(), 20000);
    return () => clearInterval(id);
  }, [loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders().finally(() => setRefreshing(false));
  };

  const handleExport = async () => {
    try {
      await restaurantApi.exportOrders({
        status: status === "Toutes" ? undefined : orderStatusToApi(status),
        mode: MODE_TO_API[mode],
        q: query || undefined,
        date: date || undefined,
      });
      toast("Export CSV téléchargé", "success");
    } catch (e) {
      toast(e?.message || "Export impossible", "error");
    }
  };

  const openWhatsApp = (e, o) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(waLink(o.customer?.phone, orderWaText(o)), "_blank", "noopener");
  };

  const countFor = (s) =>
    s === "Toutes" ? orders.length : orders.filter((o) => o.status === s).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commandes"
        subtitle={`${status === "Toutes" ? total : orders.length} commande${(status === "Toutes" ? total : orders.length) > 1 ? "s" : ""} au total`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleRefresh}>
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Actualiser
            </Button>
            <Button onClick={handleExport}>
              <Download size={16} strokeWidth={2} /> Exporter CSV
            </Button>
          </div>
        }
      />

      {/* Status pills with counts */}
      <div className="flex flex-wrap gap-2">
        {["Toutes", ...orderStatuses].map((s) => {
          const active = status === s;
          const count = countFor(s);
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-600 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              {s}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher une commande ou un client…"
            className="min-w-[240px] flex-1"
          />
          <Select value={mode} onChange={(e) => setMode(e.target.value)} className="w-auto min-w-[140px]">
            <option value="Tous">Tous les modes</option>
            <option value="Livraison">Livraison</option>
            <option value="Retrait">Retrait</option>
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        </div>

        {loading ? (
          <Card>
            <Spinner label="Chargement des commandes…" />
          </Card>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Aucune commande trouvée"
            description="Essayez de modifier vos filtres ou votre recherche."
          />
        ) : (
          <Table
            headers={["N°", "Client", "Date", "Articles", "Mode", "Paiement", "Statut", "Total", ""]}
          >
            {orders.map((o) => (
              <tr key={o._id ?? o.id} className="group transition hover:bg-zinc-50/70">
                <Td className="font-semibold text-zinc-900">{o.number || o.id}</Td>
                <Td>
                  <div>
                    <p className="font-medium text-zinc-900">{o.customer.name}</p>
                    <p className="text-xs text-zinc-400">{o.customer.phone}</p>
                  </div>
                </Td>
                <Td className="text-zinc-500">{o.date}</Td>
                <Td className="max-w-[180px] truncate text-zinc-600">
                  {o.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
                </Td>
                <Td>{o.mode}</Td>
                <Td className="text-zinc-500">{o.payment}</Td>
                <Td>
                  <Badge variant={statusVariant(o.status)} dot>
                    {o.status}
                  </Badge>
                </Td>
                <Td className="font-semibold text-zinc-900">{fmt(o.total)}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openWhatsApp(e, o)}
                      title={`WhatsApp ${o.customer?.name || ""}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91A9.85 9.85 0 0 0 12.04 2Zm5.8 14.03c-.24.68-1.42 1.3-1.96 1.35-.5.05-.98.23-2.78-.58a10.4 10.4 0 0 1-4.28-3.77c-.31-.46-.53-1-.75-1.54-.22-.55-.33-1.07-.35-1.6-.02-.52.36-1.13.62-1.44.26-.31.57-.39.76-.4h.55c.18 0 .41-.06.63.48.23.56.79 1.94.86 2.08.07.14.11.3.02.49-.09.19-.19.34-.37.53-.18.19-.28.28-.4.48-.12.2-.02.4.09.58.11.19.61.99 1.3 1.6.89.79 1.63 1.04 1.87 1.16.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.59-.18 1.27Z"/>
                      </svg>
                    </button>
                    <Link
                      to={`/dashboard/orders/${o._id ?? o.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-primary-50 hover:text-primary-600"
                      title="Voir la commande"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
