import { useEffect, useState } from "react";
import { Building2, Store, ShoppingCart, Banknote } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge, Card, CardHeader, Select, Spinner, StatCard, Table, Td } from "../../components/ui";
import { adminApi } from "../../api/admin";
import { fmt } from "../../lib/mappers";

const COLORS = ["#9ca3af", "#14b8a6", "#10b981", "#f59e0b"];

const monthLabel = (ym) => {
  if (!ym) return ym;
  const [y, m] = ym.split("-");
  return new Date(+y, +m - 1, 1).toLocaleString("fr-FR", { month: "short" });
};

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("12 mois");
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, rest, ord, pay] = await Promise.all([
          adminApi.dashboard(),
          adminApi.restaurants({ per_page: 100 }),
          adminApi.orders({ per_page: 100 }),
          adminApi.payments({ per_page: 100 }),
        ]);
        if (cancelled) return;
        const rl = rest.data || rest;
        const ol = ord.data || ord;
        const pl = pay.data || pay;
        setDash(d);
        setRestaurants(Array.isArray(rl) ? rl : []);
        setOrders(Array.isArray(ol) ? ol : []);
        setOrderTotal(ord.total ?? (Array.isArray(ol) ? ol.length : 0));
        setRevenue((Array.isArray(pl) ? pl : []).filter((p) => p.status === "approved").reduce((s, p) => s + (p.amount || 0), 0));
      } catch {
        if (!cancelled) setDash(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner label="Chargement des statistiques…" />;

  const kpis = dash?.kpis || {};
  const revenueSeries = (dash?.revenue_series || []).map((r) => ({
    month: monthLabel(r.month),
    revenus: Number(r.revenus),
  }));
  const restaurantsSeries = (dash?.series || []).map((r) => ({
    month: monthLabel(r.month),
    restaurants: Number(r.restaurants),
  }));

  const planRev = {};
  restaurants.forEach((r) => {
    const name = r.plan?.name || "Sans formule";
    planRev[name] = (planRev[name] || 0) + (r.orders_sum_total ?? 0);
  });
  const revenueByPlan = Object.entries(planRev).map(([name, value]) => ({ name, value }));

  const top = [...restaurants]
    .sort((a, b) => (b.orders_sum_total ?? 0) - (a.orders_sum_total ?? 0))
    .slice(0, 5);

  const weekLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const weekdayCounts = Array(7).fill(0);
  orders.forEach((o) => {
    if (o.created_at) weekdayCounts[new Date(o.created_at).getDay()] += 1;
  });
  const weekDays = weekLabels.map((day, i) => ({ day, commandes: weekdayCounts[i] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Statistiques</h1>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40">
          <option>30 jours</option>
          <option>6 mois</option>
          <option>12 mois</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Restaurants inscrits" value={String(kpis.restaurants ?? "—")} icon={Building2} />
        <StatCard label="Restaurants actifs" value={String(kpis.active ?? "—")} icon={Store} accent="success" />
        <StatCard label="Commandes globales" value={orderTotal.toLocaleString("fr-FR")} icon={ShoppingCart} />
        <StatCard label="Revenus" value={fmt(revenue)} icon={Banknote} />
      </div>

      <Card>
        <CardHeader title="Évolution des revenus" subtitle={`Période : ${period}`} />
        <div className="h-72 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v) => v.toLocaleString("fr-FR") + " FCFA"} />
              <Line type="monotone" dataKey="revenus" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} name="Revenus" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Nouveaux restaurants par mois" />
          <div className="h-64 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restaurantsSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip />
                <Bar dataKey="restaurants" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Restaurants" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Revenus par formule" />
          <div className="h-64 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueByPlan} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {revenueByPlan.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString("fr-FR") + " FCFA"} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top restaurants" subtitle="Par revenus générés" />
          <Table headers={["#", "Restaurant", "Formule", "Commandes", "Revenus"]}>
            {top.map((r, i) => (
              <tr key={r.id}>
                <Td className="font-semibold text-gray-400">{i + 1}</Td>
                <Td className="font-semibold text-gray-900">{r.name}</Td>
                <Td><Badge variant={r.plan?.name === "Premium" ? "primary" : "neutral"}>{r.plan?.name || "—"}</Badge></Td>
                <Td>{(r.orders_count ?? 0).toLocaleString("fr-FR")}</Td>
                <Td className="font-semibold text-gray-900">{fmt(r.orders_sum_total ?? 0)}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHeader title="Commandes par jour de semaine" />
          <div className="h-64 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekDays}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip />
                <Bar dataKey="commandes" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Commandes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}