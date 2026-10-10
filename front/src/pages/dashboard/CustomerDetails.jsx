import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Phone,
  Receipt,
  TrendingUp,
  Flame,
  Send,
  Clock,
  Sparkles,
  Gift,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Spinner,
  StatCard,
  Table,
  Td,
  statusVariant,
} from "../../components/ui";
import { fmt, mapOrder } from "../../lib/mappers";
import { restaurantApi } from "../../api/restaurant";
import { useAuth } from "../../context/AuthContext";
import DigitalLoyaltyCard from "../../components/common/DigitalLoyaltyCard";
import RelanceModal from "../../components/common/RelanceModal";

export default function CustomerDetails() {
  const { id } = useParams();
  const { restaurant } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [relanceModalOpen, setRelanceModalOpen] = useState(false);

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
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Spinner label="Chargement du client et des préférences…" />;
  if (error) return <p className="py-10 text-center text-sm text-danger-600">{error}</p>;
  if (!customer) return null;

  const orders = (customer.orders || []).map(mapOrder);
  const avgBasket =
    customer.orders_count > 0 ? Math.round(customer.total_spent / customer.orders_count) : 0;
  const days = customer.days_since_last_order;
  const isToRelance = days !== null && days >= 15;

  return (
    <div className="space-y-6">
      {/* Fil d'ariane & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            to="/dashboard/customers"
            className="inline-flex items-center gap-1.5 font-medium text-gray-500 hover:text-primary-600"
          >
            <ArrowLeft size={16} /> Clients
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-900">{customer.name}</span>
        </div>

        <button
          type="button"
          onClick={() => setRelanceModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <Send size={15} />
          <span>Relancer sur WhatsApp</span>
        </button>
      </div>

      {/* Profil Client & Statut */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={customer.name} className="h-16 w-16 !text-xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
                {customer.orders_count >= 5 && (
                  <Badge variant="primary" dot>
                    Client Fidèle VIP
                  </Badge>
                )}
                {isToRelance && (
                  <Badge variant="warning" dot>
                    Inactif ({days}j)
                  </Badge>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <Phone size={14} /> {customer.phone}
              </p>
              {customer.email && <p className="mt-0.5 text-xs text-gray-400">{customer.email}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Dernière visite</p>
              <p className="text-sm font-semibold text-gray-800">
                {customer.last_order_at
                  ? new Date(customer.last_order_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Aucune commande"}
              </p>
              {days !== null && (
                <p className="text-xs text-amber-600 font-medium">Il y a {days} jours</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Carte de Fidélité Digitale & Plat Favori */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Carte de Fidélité Digitale */}
        <DigitalLoyaltyCard
          customerName={customer.name}
          ordersCount={customer.orders_count || 0}
          threshold={5}
          rewardTitle="Une boisson offerte"
        />

        {/* Plat favori & Habitudes de commande */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
              <Flame size={16} className="text-amber-500" />
              <span>Plat Préféré du Client</span>
            </div>

            <div className="mt-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4">
              <h3 className="text-lg font-extrabold text-amber-950">
                {customer.favorite_dish || "En cours de découverte…"}
              </h3>
              <p className="mt-1 text-xs text-amber-800">
                {customer.favorite_dish
                  ? `Commandé ${customer.favorite_dish_count || "plusieurs"} fois par ce client. C'est son repas favori !`
                  : "Le plat préféré sera calculé automatiquement après ses premières commandes."}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Dernière commande : {days !== null ? `il y a ${days}j` : "—"}</span>
            <button
              type="button"
              onClick={() => setRelanceModalOpen(true)}
              className="font-bold text-emerald-600 hover:text-emerald-700 underline"
            >
              Envoyer une offre sur ce plat ➔
            </button>
          </div>
        </Card>
      </div>

      {/* KPI Financiers */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Commandes totales"
          value={String(customer.orders_count ?? 0)}
          icon={Receipt}
          accent="primary"
        />
        <StatCard
          label="Total dépensé"
          value={fmt(customer.total_spent ?? 0)}
          icon={Banknote}
          accent="success"
        />
        <StatCard
          label="Panier moyen"
          value={fmt(avgBasket)}
          icon={TrendingUp}
          accent="info"
        />
      </div>

      {/* Historique des commandes avec articles détaillés */}
      <Card>
        <CardHeader
          title="Historique des commandes"
          subtitle={`${orders.length} commande(s) enregistrée(s)`}
        />
        <Table headers={["N°", "Date", "Articles", "Statut", "Total", ""]} empty={orders.length === 0}>
          {orders.map((o) => (
            <tr key={o._id ?? o.id} className="hover:bg-gray-50/60">
              <Td className="font-semibold text-gray-900">{o.number || o.id}</Td>
              <Td className="text-gray-500">{o.date}</Td>
              <Td>
                <div className="max-w-md truncate text-xs text-gray-700">
                  {(o.items || []).map((it) => `${it.qty}× ${it.name}`).join(", ")}
                </div>
              </Td>
              <Td>
                <Badge variant={statusVariant(o.status)} dot>
                  {o.status}
                </Badge>
              </Td>
              <Td className="font-semibold text-gray-900">{fmt(o.total)}</Td>
              <Td>
                <Link
                  to={`/dashboard/orders/${o._id ?? o.id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  Détails <ArrowRight size={14} />
                </Link>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Modal de relance */}
      <RelanceModal
        open={relanceModalOpen}
        onClose={() => setRelanceModalOpen(false)}
        customer={customer}
        restaurant={restaurant}
      />
    </div>
  );
}