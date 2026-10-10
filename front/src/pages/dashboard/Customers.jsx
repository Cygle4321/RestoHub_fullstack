import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Download,
  Users as UsersIcon,
  Flame,
  Send,
  Clock,
  Sparkles,
  Phone,
  Search,
  Settings2,
  AlertTriangle,
  Crown,
  UserCheck,
} from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  EmptyState,
  StatCard,
  Table,
  Td,
  Spinner,
  useToast,
} from "../../components/ui";
import { fmt } from "../../lib/mappers";
import { restaurantApi } from "../../api/restaurant";
import { useAuth } from "../../context/AuthContext";
import RelanceModal from "../../components/common/RelanceModal";
import DigitalLoyaltyCard from "../../components/common/DigitalLoyaltyCard";
import LoyaltySettingsModal from "../../components/common/LoyaltySettingsModal";

const SEGMENT_TABS = [
  { id: "all", label: "Tous les clients", icon: UsersIcon },
  { id: "a_relancer", label: "À relancer (15-30j)", icon: Clock, countKey: "a_relancer" },
  { id: "inactif", label: "Inactifs (+30j)", icon: AlertTriangle, countKey: "inactif" },
  { id: "vip", label: "Clients Fidèles VIP (5+)", icon: Crown, countKey: "vip" },
  { id: "nouveau", label: "Nouveaux (1 cmd)", icon: UserCheck, countKey: "nouveau" },
];

export default function Customers() {
  const toast = useToast();
  const { restaurant } = useAuth();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("all");
  const [dataList, setDataList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    a_relancer: 0,
    inactif: 0,
    vip: 0,
    nouveau: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [relanceModalOpen, setRelanceModalOpen] = useState(false);
  const [loyaltyModalOpen, setLoyaltyModalOpen] = useState(false);

  const fetchCustomers = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await restaurantApi.customers({
        q: query,
        segment: segment !== "all" ? segment : undefined,
      });

      const list = res.data?.data || res.data || [];
      setDataList(list);

      if (res.stats) {
        setStats(res.stats);
      } else if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (e) {
      console.error("Erreur chargement clients:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchCustomers(false);
    return () => {
      cancelled = true;
    };
  }, [query, segment]);

  const handleExport = async () => {
    try {
      await restaurantApi.exportCustomers({ q: query || undefined });
      toast("Export CSV des clients téléchargé", "success");
    } catch (e) {
      toast(e?.message || "Export impossible", "error");
    }
  };

  const openRelance = (cust) => {
    setSelectedCustomer(cust);
    setRelanceModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Clients & CRM Fidélité
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Gérez votre base de données clients, suivez leurs plats favoris et relancez les inactifs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setLoyaltyModalOpen(true)}>
            <Settings2 size={16} /> Configurer fidélité
          </Button>

          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Exporter CSV
          </Button>
        </div>
      </div>

      {/* Bannière de différenciation concurrentielle (Glovo / Applications tierces) */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 p-5 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
              <Sparkles size={13} />
              <span>Avantage Stratégique RestoHub</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Vous possédez 100% de votre clientèle et de leurs contacts
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Contrairement aux plateformes tierces qui masquent les coordonnées de vos clients, RestoHub enregistre chaque numéro, calcule leur plat favori et vous permet d'envoyer en 1 clic un message WhatsApp personnalisé pour faire revenir ceux qui n'ont pas commandé depuis 15 jours.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSegment("a_relancer")}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-md transition"
            >
              <Clock size={16} />
              <span>Voir les clients à relancer ({stats.a_relancer})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI & Compteurs intelligents de segmentation */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clients enregistrés"
          value={String(stats.total ?? dataList.length)}
          icon={UsersIcon}
          accent="primary"
        />

        <div
          onClick={() => setSegment("a_relancer")}
          className="cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <StatCard
            label="À relancer (15-30 jours)"
            value={String(stats.a_relancer)}
            icon={Clock}
            accent="warning"
          />
        </div>

        <div
          onClick={() => setSegment("inactif")}
          className="cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <StatCard
            label="Inactifs (> 30 jours)"
            value={String(stats.inactif)}
            icon={AlertTriangle}
            accent="danger"
          />
        </div>

        <div
          onClick={() => setSegment("vip")}
          className="cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <StatCard
            label="Clients Fidèles VIP (5+ cmd)"
            value={String(stats.vip)}
            icon={Crown}
            accent="success"
          />
        </div>
      </div>

      {/* Tableau et segmentation */}
      <Card>
        {/* Onglets de segmentation */}
        <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none px-4 pt-3 gap-1">
          {SEGMENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.countKey ? stats[tab.countKey] : stats.total;
            const active = segment === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSegment(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold transition ${
                  active
                    ? "border-primary-600 text-primary-700 bg-primary-50/40 rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200"
                }`}
              >
                <Icon size={14} className={active ? "text-primary-600" : "text-gray-400"} />
                <span>{tab.label}</span>
                {count !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${
                      active
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Barre de recherche */}
        <div className="border-b border-gray-100 p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom, téléphone ou plat favori…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>
        </div>

        <CardHeader
          title={`Liste des clients (${dataList.length})`}
          subtitle={
            segment === "a_relancer"
              ? "Clients n'ayant pas commandé depuis 15 à 30 jours : relancez-les avec une remise"
              : segment === "inactif"
                ? "Clients inactifs depuis plus de 30 jours"
                : segment === "vip"
                  ? "Clients fidèles ayant passé 5 commandes ou plus"
                  : "Historique et profil d'achat de vos clients"
          }
        />

        {loading ? (
          <div className="p-10">
            <Spinner label="Chargement des profils clients et plats favoris…" />
          </div>
        ) : dataList.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Aucun client dans ce segment"
            description="Aucun client ne correspond aux critères de filtre sélectionnés."
            action={
              segment !== "all" && (
                <Button size="sm" variant="secondary" onClick={() => setSegment("all")}>
                  Afficher tous les clients
                </Button>
              )
            }
          />
        ) : (
          <Table
            headers={[
              "Client",
              "Téléphone",
              "Plat favori",
              "Dernière commande",
              "Carte de Fidélité",
              "Total dépensé",
              "Actions",
            ]}
          >
            {dataList.map((c) => {
              const days = c.days_since_last_order;
              const isToRelance = days !== null && days >= 15;
              const isInactive = days !== null && days >= 30;

              return (
                <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900">{c.name}</span>
                          {c.orders_count >= 5 && (
                            <span title="Client VIP (5+ commandes)" className="text-amber-500">
                              👑
                            </span>
                          )}
                        </div>
                        {c.email && <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{c.email}</p>}
                      </div>
                    </div>
                  </Td>

                  <Td>
                    <a
                      href={`tel:${c.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-700 hover:text-emerald-700 transition"
                    >
                      <Phone size={12} className="text-gray-400" />
                      <span>{c.phone}</span>
                    </a>
                  </Td>

                  <Td>
                    {c.favorite_dish ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-semibold text-amber-900">
                        <Flame size={12} className="text-amber-600" />
                        <span className="truncate max-w-[140px]">{c.favorite_dish}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Non déterminé</span>
                    )}
                  </Td>

                  <Td>
                    <div>
                      <p className="text-xs text-gray-700 font-medium">
                        {c.last_order_at
                          ? new Date(c.last_order_at).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Jamais"}
                      </p>
                      {days !== null && (
                        <p className="mt-0.5">
                          {isInactive ? (
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-danger-50 text-danger-700">
                              Il y a {days} jours
                            </span>
                          ) : isToRelance ? (
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800">
                              Il y a {days} jours ⚠️
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-medium">
                              Il y a {days} jour{days > 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </Td>

                  <Td>
                    <DigitalLoyaltyCard
                      customerName={c.name}
                      ordersCount={c.orders_count || 0}
                      threshold={5}
                      compact
                    />
                  </Td>

                  <Td className="font-semibold text-gray-900">
                    {fmt(c.total_spent || 0)}
                  </Td>

                  <Td>
                    <div className="flex items-center gap-1.5">
                      {/* Bouton de relance 1-clic */}
                      <button
                        type="button"
                        onClick={() => openRelance(c)}
                        title="Relancer sur WhatsApp avec plat favori et promo"
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                          isToRelance
                            ? "bg-amber-500 text-white hover:bg-amber-600 shadow-xs"
                            : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        <Send size={12} />
                        <span>Relancer</span>
                      </button>

                      {/* Lien vers la fiche détaillée */}
                      <Link
                        to={`/dashboard/customers/${c.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-primary-50 hover:text-primary-600"
                        title="Voir la fiche client détaillée"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Modal de Relance Client Automatique en 1-Clic */}
      <RelanceModal
        open={relanceModalOpen}
        onClose={() => setRelanceModalOpen(false)}
        customer={selectedCustomer}
        restaurant={restaurant}
      />

      {/* Modal de Configuration du Programme de Fidélité */}
      <LoyaltySettingsModal
        open={loyaltyModalOpen}
        onClose={() => setLoyaltyModalOpen(false)}
        onSaved={() => fetchCustomers(true)}
      />
    </div>
  );
}
