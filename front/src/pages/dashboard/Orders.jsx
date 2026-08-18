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
import { fmt } from "../../lib/mappers";

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

  const loadOrders = useCallback(async () => {
    try {
      const data = await restaurantApi.orders({
        status: status === "Toutes" ? undefined : status,
        mode: MODE_TO_API[mode],
        q: query || undefined,
        date: date || undefined,
      });
      setOrders(data.data || data || []);
    } catch {
      setOrders([]);
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

  const countFor = (s) =>
    s === "Toutes" ? orders.length : orders.filter((o) => o.status === s).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commandes"
        subtitle={`${orders.length} commandes au total`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleRefresh}>
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Actualiser
            </Button>
            <Button onClick={() => toast("Export des commandes en cours…", "info")}>
              <Download size={16} strokeWidth={2} /> Exporter
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
                  <Link
                    to={`/dashboard/orders/${o._id ?? o.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-primary-50 hover:text-primary-600"
                    title="Voir la commande"
                  >
                    <ArrowRight size={16} />
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
