import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Download } from "lucide-react";
import { Badge, Button, Card, SearchInput, Select, Spinner, Table, Td, Avatar, EmptyState, statusVariant, useToast } from "../../components/ui";
import { adminApi } from "../../api/admin";
import { fmt } from "../../lib/mappers";

const STATUS_UI = {
  active: "Actif",
  suspended: "Suspendu",
  pending: "En attente",
  inactive: "Inactif",
};

export default function AdminRestaurants() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Tous");
  const [plan, setPlan] = useState("Tous");
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, plansRes] = await Promise.all([
          adminApi.restaurants({ per_page: 100 }),
          adminApi.plans(),
        ]);
        if (cancelled) return;
        const list = data.data || data;
        const pl = plansRes.data || plansRes;
        setItems(
          (Array.isArray(list) ? list : []).map((r) => ({
            id: r.id,
            name: r.name,
            owner: r.users?.[0]?.name || r.email || "—",
            plan: r.plan?.name || "—",
            status: STATUS_UI[r.status] || r.status,
            joined: r.created_at,
            orders: r.orders_count ?? 0,
            revenue: r.orders_sum_total ?? 0,
          }))
        );
        setPlans(Array.isArray(pl) ? pl : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = items.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.name.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q)) &&
      (status === "Tous" || r.status === status) &&
      (plan === "Tous" || r.plan === plan)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Restaurants</h1>
        <Button onClick={() => toast("Export CSV généré")}>
          <Download size={16} /> Exporter
        </Button>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un restaurant ou un propriétaire…" className="flex-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
            <option>Tous</option>
            <option>En attente</option>
            <option>Actif</option>
            <option>Suspendu</option>
            <option>Inactif</option>
          </Select>
          <Select value={plan} onChange={(e) => setPlan(e.target.value)} className="sm:w-40">
            <option>Tous</option>
            {plans.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        {loading ? (
          <div className="p-6"><Spinner label="Chargement des restaurants…" /></div>
        ) : (
          <>
            <Table headers={["Restaurant", "Propriétaire", "Abonnement", "Statut", "Inscrit le", "Commandes", "Revenus", ""]} empty={filtered.length === 0}>
              {filtered.map((r) => (
                <tr key={r.id} className="cursor-pointer transition hover:bg-gray-50" onClick={() => navigate(`/admin/restaurants/${r.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} />
                      <span className="font-semibold text-gray-900">{r.name}</span>
                    </div>
                  </Td>
                  <Td>{r.owner}</Td>
                  <Td><Badge variant={r.plan === "Premium" ? "primary" : "neutral"}>{r.plan}</Badge></Td>
                  <Td><Badge variant={statusVariant(r.status)} dot>{r.status}</Badge></Td>
                  <Td>{new Date(r.joined).toLocaleDateString("fr-FR")}</Td>
                  <Td>{r.orders.toLocaleString("fr-FR")}</Td>
                  <Td className="font-semibold text-gray-900">{fmt(r.revenue)}</Td>
                  <Td className="text-gray-400">→</Td>
                </tr>
              ))}
            </Table>
            {filtered.length === 0 && (
              <EmptyState icon={Building2} title="Aucun restaurant" description="Aucun restaurant ne correspond à votre recherche." />
            )}
          </>
        )}
      </Card>
    </div>
  );
}