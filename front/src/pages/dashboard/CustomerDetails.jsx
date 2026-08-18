import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Banknote, Phone, Receipt, TrendingUp } from "lucide-react";
import { Avatar, Badge, Card, CardHeader, Spinner, StatCard, Table, Td, statusVariant } from "../../components/ui";
import { fmt, mapOrder } from "../../lib/mappers";
import { restaurantApi } from "../../api/restaurant";

export default function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await restaurantApi.customer(id);
        if (!cancelled) setCustomer(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Impossible de charger le client.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Spinner label="Chargement du client…" />;
  if (error) return <p className="py-10 text-center text-sm text-danger-600">{error}</p>;
  if (!customer) return null;

  const orders = (customer.orders || []).map(mapOrder);
  const avgBasket = customer.orders_count > 0 ? Math.round(customer.total_spent / customer.orders_count) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/dashboard/customers" className="inline-flex items-center gap-1.5 font-medium text-gray-500 hover:text-primary-600">
          <ArrowLeft size={16} /> Clients
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-900">{customer.name}</span>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={customer.name} className="h-16 w-16 !text-xl" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500"><Phone size={14} /> {customer.phone}</p>
              {customer.email && <p className="mt-0.5 text-xs text-gray-400">{customer.email}</p>}
            </div>
          </div>
          {customer.orders_count >= 5 && <Badge variant="primary" dot>Cliente fidèle</Badge>}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Commandes" value={String(customer.orders_count ?? 0)} icon={Receipt} accent="primary" />
        <StatCard label="Total dépensé" value={fmt(customer.total_spent ?? 0)} icon={Banknote} accent="success" />
        <StatCard label="Panier moyen" value={fmt(avgBasket)} icon={TrendingUp} accent="info" />
      </div>

      <Card>
        <CardHeader title="Historique des commandes" subtitle={`${orders.length} commande(s) récente(s)`} />
        <Table headers={["N°", "Date", "Articles", "Statut", "Total", ""]} empty={orders.length === 0}>
          {orders.map((o) => (
            <tr key={o._id ?? o.id} className="hover:bg-gray-50/60">
              <Td className="font-semibold text-gray-900">{o.number || o.id}</Td>
              <Td className="text-gray-500">{o.date}</Td>
              <Td>{(o.items || []).map((it) => `${it.qty}× ${it.name}`).join(", ")}</Td>
              <Td><Badge variant={statusVariant(o.status)} dot>{o.status}</Badge></Td>
              <Td className="font-semibold text-gray-900">{fmt(o.total)}</Td>
              <Td>
                <Link to={`/dashboard/orders/${o._id ?? o.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
                  Détails <ArrowRight size={14} />
                </Link>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}