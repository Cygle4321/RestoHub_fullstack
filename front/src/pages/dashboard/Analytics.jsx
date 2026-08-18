import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Banknote, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { Card, CardHeader, Select, Spinner, StatCard, Table, Td } from "../../components/ui";
import { fmt } from "../../lib/mappers";
import { restaurantApi } from "../../api/restaurant";

const PERIOD_DAYS = { "7j": 7, "30j": 30, "90j": 90, "12 mois": 365 };

export default function Analytics() {
  const [period, setPeriod] = useState("30j");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await restaurantApi.dashboard({ days: PERIOD_DAYS[period] });
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  const kpis = data?.kpis || {};
  const sales = (data?.sales_series || []).map((r) => ({
    day: r.day,
    ventes: Number(r.ventes) || 0,
    commandes: Number(r.commandes) || 0,
  }));
  const topProducts = data?.top_products || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Statistiques</h1>
        <Select value={period} onChange={(e) => { setPeriod(e.target.value); setLoading(true); }} className="w-auto">
          <option value="7j">7 derniers jours</option>
          <option value="30j">30 derniers jours</option>
          <option value="90j">90 derniers jours</option>
          <option value="12 mois">12 mois</option>
        </Select>
      </div>

      {loading ? (
        <Card className="flex h-64 items-center justify-center"><Spinner label="Chargement des statistiques…" /></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Chiffre d'affaires" value={fmt(kpis.revenue)} icon={Banknote} />
            <StatCard label="Commandes" value={String(kpis.orders ?? "—")} icon={ShoppingCart} accent="info" />
            <StatCard label="Clients" value={String(kpis.customers ?? "—")} icon={Users} accent="success" />
            <StatCard label="Panier moyen" value={fmt(kpis.avg_basket)} icon={TrendingUp} accent="danger" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Évolution des ventes" subtitle={`Période : ${period}`} />
              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={sales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }} />
                    <Line type="monotone" dataKey="ventes" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 3, fill: "#14b8a6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Commandes par jour" subtitle="Volume de commandes" />
              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }} />
                    <Bar dataKey="commandes" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Produits populaires" subtitle="Classement par nombre de commandes" />
            <Table headers={["#", "Produit", "Commandes"]} empty={topProducts.length === 0}>
              {topProducts.map((p, i) => (
                <tr key={p.name} className="hover:bg-gray-50/60">
                  <Td className="font-bold text-gray-400">{i + 1}</Td>
                  <Td className="font-semibold text-gray-900">{p.name}</Td>
                  <Td>{p.count}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}