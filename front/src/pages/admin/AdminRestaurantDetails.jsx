import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Banknote, Receipt, Star } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Avatar, Badge, Button, Card, CardHeader, Modal, StatCard, Table, Td, Spinner, statusVariant, useToast } from "../../components/ui";
import { adminApi } from "../../api/admin";
import { fmt } from "../../lib/mappers";

const STATUS_UI = {
  active: "Actif",
  suspended: "Suspendu",
  pending: "En attente",
  inactive: "Inactif",
};

export default function AdminRestaurantDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [r, setR] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminApi.restaurant(id);
        const list = await adminApi.orders({ restaurant_id: id, per_page: 30 });
        if (cancelled) return;
        setR(data);
        setOrders((list.data || list || []).map((o) => ({
          id: o.number || o.id,
          number: o.number,
          customer: o.customer?.name || o.customer_name || "—",
          date: o.created_at || o.date,
          status: o.status,
          total: o.total,
        })));
      } catch {
        if (!cancelled) { setR(null); setOrders([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Spinner label="Chargement du restaurant…" />;
  if (!r) {
    return <p className="py-10 text-center text-sm text-danger-600">Restaurant introuvable.</p>;
  }

  const owner = r.users?.[0]?.name || r.email || "—";
  const ownerEmail = r.users?.[0]?.email || r.email || "";
  const mailto = `mailto:${ownerEmail}?subject=${encodeURIComponent(`[RestoHub] Contact — ${r.name}`)}`;
  const status = STATUS_UI[r.status] || r.status;
  const planName = r.plan?.name || "—";
  const sub = r.active_subscription || r.activeSubscription;

  const ordersCount = r.orders_count ?? 0;
  const revenue = r.orders_sum_total ?? 0;
  const avgBasket = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;
  const subAmount = sub?.amount ?? (planName === "Premium" ? 50000 : planName === "Business" ? 25000 : 10000);

  // Ventes des 7 derniers jours (dérivées des commandes chargées)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const salesSeries = days.map((d) => {
    const key = d.toLocaleDateString("fr-FR");
    const total = orders
      .filter((o) => {
        const od = o.date ? new Date(o.date).toLocaleDateString("fr-FR") : "";
        return od === key;
      })
      .reduce((s, o) => s + (o.total || 0), 0);
    return { day: d.toLocaleDateString("fr-FR", { weekday: "short" }), ventes: total };
  });

  const handleStatus = async (next) => {
    setSaving(true);
    try {
      const updated = await adminApi.updateRestaurantStatus(r.id, next);
      setR((prev) => ({ ...prev, status: updated.status ?? next }));
      toast(next === "suspended" ? `${r.name} a été suspendu` : `${r.name} a été réactivé`, next === "suspended" ? "error" : "success");
    } catch {
      toast("Impossible de mettre à jour le statut", "error");
    } finally {
      setSaving(false);
      setConfirmSuspend(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/admin/restaurants" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800">
        <ArrowLeft size={16} /> Retour aux restaurants
      </Link>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={r.name} className="h-14 w-14 text-lg" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{r.name}</h1>
              <p className="text-sm text-gray-500">Propriétaire : {owner}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant={planName === "Premium" ? "primary" : "neutral"}>{planName}</Badge>
                <Badge variant={statusVariant(status)} dot>{status}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {status === "Suspendu" ? (
              <Button variant="secondary" onClick={() => handleStatus("active")} disabled={saving}>Réactiver</Button>
            ) : (
              <Button variant="danger" onClick={() => setConfirmSuspend(true)} disabled={saving}>Suspendre</Button>
            )}
            <Button
              variant="secondary"
              onClick={() => (ownerEmail ? (window.location.href = mailto) : toast("Aucun email de contact disponible", "error"))}
            >Contacter</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Commandes" value={ordersCount.toLocaleString("fr-FR")} icon={ShoppingCart} />
        <StatCard label="Revenus" value={fmt(revenue)} icon={Banknote} accent="success" />
        <StatCard label="Panier moyen" value={fmt(avgBasket)} icon={Receipt} accent="info" />
        <StatCard label="Abonnement" value={fmt(subAmount)} icon={Star} accent="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Ventes" subtitle="7 derniers jours" />
          <div className="h-64 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v) => v.toLocaleString("fr-FR") + " FCFA"} />
                <Line type="monotone" dataKey="ventes" stroke="#14b8a6" strokeWidth={2} dot={false} name="Ventes" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Abonnement" subtitle={planName} />
          <div className="space-y-3 p-5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Formule</span><span className="font-semibold text-gray-900">{planName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Montant</span><span className="font-semibold text-gray-900">{fmt(subAmount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Renouvellement</span><span className="font-semibold text-gray-900">{sub?.ends_at ? new Date(sub.ends_at).toLocaleDateString("fr-FR") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Inscrit le</span><span className="font-semibold text-gray-900">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span></div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Commandes récentes" />
        <Table headers={["N°", "Client", "Date", "Statut", "Total"]}>
          {orders.map((o) => (
            <tr key={o.id}>
              <Td className="font-mono text-xs">{o.id}</Td>
              <Td className="font-semibold text-gray-900">{o.customer}</Td>
              <Td>{o.date ? new Date(o.date).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</Td>
              <Td><Badge variant={statusVariant(o.status)} dot>{o.status}</Badge></Td>
              <Td className="font-semibold text-gray-900">{fmt(o.total)}</Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal
        open={confirmSuspend}
        onClose={() => setConfirmSuspend(false)}
        title="Suspendre le restaurant"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmSuspend(false)}>Annuler</Button>
            <Button variant="danger" onClick={() => handleStatus("suspended")} disabled={saving}>Confirmer</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Voulez-vous vraiment suspendre <strong>{r.name}</strong> ? Sa boutique sera immédiatement hors ligne.</p>
      </Modal>
    </div>
  );
}