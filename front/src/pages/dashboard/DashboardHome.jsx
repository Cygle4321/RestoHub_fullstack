import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Banknote, ChevronRight, ShoppingCart, TrendingUp, Users, ArrowUpRight,
} from "lucide-react";
import {
  Badge, Card, CardHeader, StatCard, Tabs, statusVariant, PageHeader, Spinner,
} from "../../components/ui";
import { restaurantApi } from "../../api/restaurant";
import { fmt } from "../../lib/mappers";

const PRIMARY = "#14b8a6";
const PERIOD_DAYS = { "7 jours": 7, "30 jours": 30, "12 mois": 365 };

export default function DashboardHome() {
  const [range, setRange] = useState("7 jours");
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [salesSeries, setSalesSeries] = useState([]);
  const [pending, setPending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await restaurantApi.dashboard({ days: PERIOD_DAYS[range] });
        if (cancelled) return;
        setKpis(data.kpis);
        setSalesSeries(
          (data.sales_series || []).map((r) => ({
            day: r.day,
            ventes: Number(r.ventes) || 0,
            commandes: Number(r.commandes) || 0,
          }))
        );
        setPending(data.pending_orders || []);
        setRecent(data.recent_orders || []);
        setTopProducts(data.top_products || []);
      } catch {
        if (cancelled) return;
        setKpis({ revenue: 0, orders: 0, customers: 0, avg_basket: 0 });
        setSalesSeries([]);
        setPending([]);
        setRecent([]);
        setTopProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [range]);

  if (loading) return <Spinner label="Chargement du tableau de bord…" />;

  const maxTop = topProducts[0]?.count || 1;

  return (
    <div className="space-y-7">
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de votre activité" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Chiffre d'affaires" value={fmt(kpis?.revenue)} icon={Banknote} trend="+12%" />
        <StatCard label="Commandes" value={String(kpis?.orders ?? "—")} icon={ShoppingCart} trend="+8%" accent="info" />
        <StatCard label="Clients" value={String(kpis?.customers ?? "—")} icon={Users} trend="+15%" accent="success" />
        <StatCard label="Panier moyen" value={fmt(kpis?.avg_basket)} icon={TrendingUp} trend="+3%" accent="neutral" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Ventes de la semaine"
            subtitle="Évolution du chiffre d'affaires"
            action={<Tabs tabs={["7 jours", "30 jours", "12 mois"]} active={range} onChange={setRange} />}
          />
          <div className="px-2 pb-4 pt-2 sm:px-4">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesSeries}>
                <defs>
                  <linearGradient id="ventes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="day" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} width={36} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 12 }} />
                <Area type="monotone" dataKey="ventes" stroke={PRIMARY} strokeWidth={2.5} fill="url(#ventes)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="À traiter"
            subtitle={`${pending.length} commandes`}
            action={<Link to="/dashboard/orders" className="text-xs font-semibold text-primary-600">Tout voir <ArrowUpRight size={13} className="inline" /></Link>}
          />
          <ul className="divide-y divide-zinc-50">
            {pending.slice(0, 6).map((o) => (
              <li key={o._id ?? o.id}>
                <Link to={`/dashboard/orders/${o._id ?? o.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-zinc-50/80">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900">{o.number || o.id}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{o.customer_name || o.customer?.name} · {fmt(o.total)}</p>
                  </div>
                  <Badge variant={statusVariant(o.status)} dot>{o.status}</Badge>
                </Link>
              </li>
            ))}
            {!pending.length && <li className="px-5 py-8 text-center text-sm text-zinc-400">Aucune commande en attente</li>}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Produits populaires" subtitle="Top de la période" />
          <ul className="divide-y divide-zinc-50 px-1">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-4 px-4 py-3.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${i === 0 ? "bg-primary-500 text-white" : "bg-zinc-100 text-zinc-500"}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold text-zinc-900">{p.name}</p>
                    <span className="text-xs font-semibold text-zinc-600">{p.count}</span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-primary-400/80" style={{ width: `${(Number(p.count) / maxTop) * 100}%` }} />
                  </div>
                </div>
              </li>
            ))}
            {!topProducts.length && <li className="px-5 py-8 text-center text-sm text-zinc-400">Pas encore de données</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Commandes récentes" action={<Link to="/dashboard/orders" className="text-xs font-semibold text-primary-600">Tout voir <ArrowUpRight size={13} className="inline" /></Link>} />
          <ul className="divide-y divide-zinc-50">
            {recent.map((o) => (
              <li key={o._id ?? o.id}>
                <Link to={`/dashboard/orders/${o._id ?? o.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-zinc-50/80">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900">{o.number || o.id}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{o.customer_name || o.customer?.name} · {fmt(o.total)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(o.status)} dot>{o.status}</Badge>
                    <ChevronRight size={14} className="text-zinc-300" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
