import { Link } from "react-router-dom";
import {
  Building2,
  Store,
  ShoppingCart,
  Banknote,
  ArrowUpRight,
  AlertTriangle,
  Users,
  TrendingUp,
  CreditCard,
  LifeBuoy,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardHeader,
  StatCard,
  Badge,
  Avatar,
  PageHeader,
  Button,
  Spinner,
} from "../../components/ui";
import { fmt } from "../../lib/mappers";
import { adminApi } from "../../api/admin";
import { useEffect, useState } from "react";

const PRIMARY = "#14b8a6";

const monthLabel = (ym) => {
  if (!ym) return ym;
  const [y, m] = ym.split("-");
  return new Date(+y, +m - 1, 1).toLocaleString("fr-FR", { month: "short" });
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  const h = Math.floor(diff / 3600);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Hier" : `Il y a ${d} jours`;
};

export default function AdminDashboard() {
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard()
      .then(setRemote)
      .catch(() => setRemote(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Chargement admin…" />;

  const kpis = remote?.kpis || {};
  const alerts = [
    { label: "Paiements en retard", count: remote?.alerts?.past_due ?? 0, to: "/admin/subscriptions" },
    { label: "Tickets ouverts", count: remote?.alerts?.tickets_open ?? 0, to: "/admin/support" },
    { label: "Restaurants suspendus", count: remote?.alerts?.suspended ?? 0, to: "/admin/restaurants" },
  ];

  const activity = (remote?.activity || []).map((a) => ({
    type: a.type,
    text: a.text,
    time: timeAgo(a.at),
    tone: a.tone || "primary",
  }));

  const planData = remote?.plan_breakdown || [];
  const planTotal = planData.reduce((s, p) => s + p.count, 0) || 1;
  const breakdown = planData.map((p) => ({
    name: p.name,
    count: p.count,
    pct: Math.round((p.count / planTotal) * 100),
    color:
      p.name === "Premium" ? "bg-success-500" : p.name === "Business" ? "bg-primary-500" : "bg-zinc-400",
  }));

  const revenue = (remote?.revenue_series || []).map((r) => ({
    month: monthLabel(r.month),
    revenus: Number(r.revenus),
  }));

  const ordersChart = (remote?.orders_series || []).map((r) => ({
    month: monthLabel(r.month),
    commandes: Number(r.commandes),
  }));

  const latest = (remote?.latest_restaurants || []).map((r) => ({
    id: r.id,
    name: r.name,
    joined: r.created_at,
    city: r.address ? r.address.split(",")[0].trim() : "",
    plan: r.plan?.name || "—",
    status: r.status === "active" ? "Actif" : r.status === "suspended" ? "Suspendu" : "Inactif",
  }));

  const activation =
    kpis.restaurants > 0 ? Math.round((kpis.active / kpis.restaurants) * 100) : 0;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Vue d'ensemble"
        subtitle="Pilotage de la plateforme RestoHub"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/restaurants">
              <Button variant="secondary" size="sm">
                <Building2 size={14} /> Restaurants
              </Button>
            </Link>
            <Link to="/admin/subscriptions">
              <Button size="sm">
                <CreditCard size={14} /> Abonnements
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Restaurants inscrits"
          value={String(kpis.restaurants ?? "—")}
          icon={Building2}
        />
        <StatCard
          label="Restaurants actifs"
          value={String(kpis.active ?? "—")}
          icon={Store}
          accent="success"
        />
        <StatCard
          label="Commandes (mois)"
          value={String(kpis.orders_month ?? "—")}
          icon={ShoppingCart}
          accent="info"
        />
        <StatCard
          label="MRR plateforme"
          value={fmt(kpis.mrr ?? null)}
          icon={Banknote}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Users size={20} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[13px] font-medium text-zinc-500">Utilisateurs</p>
            <p className="text-xl font-bold tracking-tight text-zinc-900">{kpis.users ?? "—"}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp size={20} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[13px] font-medium text-zinc-500">Taux d'activation</p>
            <p className="text-xl font-bold tracking-tight text-zinc-900">{activation}%</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-50 text-success-600">
            <CreditCard size={20} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[13px] font-medium text-zinc-500">Abonnements actifs</p>
            <p className="text-xl font-bold tracking-tight text-zinc-900">{kpis.subscriptions_active ?? "—"}</p>
          </div>
        </Card>
      </div>

      {/* Alerts strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {alerts.map((a) => (
          <Link key={a.label} to={a.to}>
            <Card className="flex items-center gap-3 p-4 transition hover:shadow-elevated" hover>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle size={16} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-zinc-900">{a.label}</p>
                <p className="text-xs text-zinc-500">À traiter</p>
              </div>
              <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-bold text-white">
                {a.count}
              </span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Revenus plateforme"
            subtitle="Évolution mensuelle (FCFA)"
            action={
              <Link
                to="/admin/analytics"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Analytics <ArrowUpRight size={13} />
              </Link>
            }
          />
          <div className="h-72 px-2 pb-4 pt-1 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(v) => [v.toLocaleString("fr-FR") + " FCFA", "Revenus"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e4e4e7",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenus"
                  stroke={PRIMARY}
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  name="Revenus"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Répartition des plans"
            subtitle={`${kpis.subscriptions_active ?? 0} abonnements actifs`}
          />
          <div className="space-y-5 p-5">
            {breakdown.map((b) => (
              <div key={b.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700">{b.name}</span>
                  <span className="text-zinc-500">
                    {b.count} · {b.pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full ${b.color}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
            <Link to="/admin/subscriptions" className="block">
              <Button variant="secondary" className="mt-2 w-full" size="sm">
                Gérer les abonnements
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Volume de commandes" subtitle="Commandes passées via la plateforme" />
          <div className="h-64 px-2 pb-4 pt-1 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e4e4e7",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="commandes"
                  fill={PRIMARY}
                  radius={[6, 6, 0, 0]}
                  name="Commandes"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Activité récente"
            subtitle="Événements plateforme"
            action={
              <Link
                to="/admin/support"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary-600"
              >
                Support <ArrowUpRight size={13} />
              </Link>
            }
          />
          <ul className="divide-y divide-zinc-50">
            {activity.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    a.tone === "success"
                      ? "bg-success-50 text-success-600"
                      : a.tone === "warning"
                        ? "bg-amber-50 text-amber-600"
                        : a.tone === "danger"
                          ? "bg-danger-50 text-danger-600"
                          : a.tone === "info"
                            ? "bg-sky-50 text-sky-600"
                            : "bg-primary-50 text-primary-600"
                  }`}
                >
                  {a.tone === "support" || a.type === "support" ? (
                    <LifeBuoy size={14} />
                  ) : a.type === "alert" || a.type === "churn" ? (
                    <AlertTriangle size={14} />
                  ) : a.type === "payment" ? (
                    <Banknote size={14} />
                  ) : a.type === "order" ? (
                    <ShoppingCart size={14} />
                  ) : (
                    <Building2 size={14} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug text-zinc-800">{a.text}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Latest restaurants */}
      <Card>
        <CardHeader
          title="Derniers restaurants inscrits"
          subtitle={`${latest.length} inscriptions récentes`}
          action={
            <Link
              to="/admin/restaurants"
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              Voir tous <ArrowUpRight size={13} />
            </Link>
          }
        />
        <ul className="divide-y divide-zinc-50">
          {latest.map((r) => (
            <li key={r.id}>
              <Link
                to={`/admin/restaurants/${r.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-zinc-50/80"
              >
                <Avatar name={r.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{r.name}</p>
                  <p className="text-xs text-zinc-500">
                    Inscrit le {new Date(r.joined).toLocaleDateString("fr-FR")}
                    {r.city ? ` · ${r.city}` : ""}
                  </p>
                </div>
                <Badge variant={r.plan === "Premium" ? "primary" : r.plan === "Business" ? "info" : "neutral"}>
                  {r.plan}
                </Badge>
                <Badge variant={r.status === "Actif" ? "success" : "danger"} dot>
                  {r.status || "Actif"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
