import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, FlaskConical, Clock } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge, Button, Card, CardHeader, Input, StatCard, Table, Td, Toggle, Spinner, statusVariant, useToast } from "../../components/ui";
import { adminApi } from "../../api/admin";
import { fmt } from "../../lib/mappers";

const COLORS = ["#9ca3af", "#14b8a6", "#10b981", "#f59e0b"];

const SUB_STATUS_UI = {
  active: "Actif",
  trialing: "Essai",
  past_due: "En retard",
  canceled: "Annulé",
  cancelled: "Annulé",
};

export default function AdminSubscriptions() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);

  const load = async () => {
    const [pl, su] = await Promise.all([
      adminApi.plans(),
      adminApi.subscriptions({ per_page: 100 }),
    ]);
    const list = su.data || su;
    setPlans(Array.isArray(pl) ? pl : []);
    setSubs(Array.isArray(list) ? list : []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => { setLoading(false); setPlans([]); setSubs([]); });
  }, []);

  const activeSubs = subs.filter((s) => s.status === "active");
  const mrr = activeSubs.reduce((s, x) => s + (x.amount || 0), 0);
  const trialing = subs.filter((s) => s.status === "trialing").length;
  const pastDue = subs.filter((s) => s.status === "past_due").length;

  const byPlan = {};
  subs.forEach((s) => {
    const name = s.plan?.name || "Sans formule";
    byPlan[name] = (byPlan[name] || 0) + 1;
  });
  const repartition = Object.entries(byPlan).map(([name, value], i) => ({
    name,
    value,
    fill: COLORS[i % COLORS.length],
  }));

  const recent = subs.slice(0, 5).map((s) => ({
    id: s.id,
    restaurant: s.restaurant?.name || "—",
    plan: s.plan?.name || "—",
    amount: s.amount || 0,
    date: s.created_at,
    status: SUB_STATUS_UI[s.status] || s.status,
  }));

  const updatePlan = async (id, body) => {
    try {
      const updated = await adminApi.updatePlan(id, body);
      setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      toast("Formule enregistrée");
      return true;
    } catch {
      toast("Erreur lors de l'enregistrement", "error");
      return false;
    }
  };

  const patchLocal = (id, patch) =>
    setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  if (loading) return <Spinner label="Chargement des abonnements…" />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Abonnements</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MRR" value={fmt(mrr)} icon={Banknote} />
        <StatCard label="Abonnements actifs" value={String(activeSubs.length)} icon={CheckCircle2} accent="success" />
        <StatCard label="Essais en cours" value={String(trialing)} icon={FlaskConical} accent="info" />
        <StatCard label="En retard" value={String(pastDue)} icon={Clock} accent="danger" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Gestion des formules</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">{p.name}</h3>
                <Toggle
                  checked={p.is_active}
                  onChange={(v) => { patchLocal(p.id, { is_active: v }); updatePlan(p.id, { is_active: v }); }}
                  label={p.is_active ? "Actif" : "Inactif"}
                />
              </div>
              <div className="mt-4">
                <Input
                  label="Prix mensuel (FCFA)"
                  type="number"
                  value={p.price_monthly}
                  onChange={(e) => patchLocal(p.id, { price_monthly: Number(e.target.value) })}
                />
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Fonctionnalités</p>
                <div className="space-y-2">
                  {(p.features || []).map((f, j) => (
                    <input
                      key={j}
                      value={f}
                      onChange={(e) => {
                        const features = [...(p.features || [])];
                        features[j] = e.target.value;
                        patchLocal(p.id, { features });
                      }}
                      className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-primary-500 focus:bg-white focus:outline-none"
                    />
                  ))}
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => updatePlan(p.id, { price_monthly: p.price_monthly, features: p.features || [] })}
              >
                Enregistrer
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Répartition par formule" subtitle={`${subs.length} abonnements`} />
          <div className="h-72 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={repartition} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {repartition.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Abonnements récents" />
          <Table headers={["Restaurant", "Formule", "Montant", "Date", "Statut"]}>
            {recent.map((s) => (
              <tr key={s.id}>
                <Td className="font-semibold text-gray-900">{s.restaurant}</Td>
                <Td><Badge variant={s.plan === "Premium" ? "primary" : "neutral"}>{s.plan}</Badge></Td>
                <Td>{fmt(s.amount)}</Td>
                <Td>{s.date ? new Date(s.date).toLocaleDateString("fr-FR") : "—"}</Td>
                <Td><Badge variant={statusVariant(s.status)} dot>{s.status}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}