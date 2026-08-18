import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, UserPlus, Users as UsersIcon } from "lucide-react";
import { Avatar, Card, CardHeader, EmptyState, SearchInput, StatCard, Table, Td, Spinner } from "../../components/ui";
import { customers as initial, fmt } from "../../data/mock";
import { restaurantApi } from "../../api/restaurant";

export default function Customers() {
  const [query, setQuery] = useState("");
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await restaurantApi.customers({ q: query });
        if (!cancelled) setDataList(res.data?.data || res.data || res || []);
      } catch {
        if (!cancelled) setDataList(initial);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [query]);

  const filtered = dataList.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || (c.phone && c.phone.includes(query))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Clients</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Clients totaux" value={dataList.length.toString()} icon={UsersIcon} accent="primary" />
        <StatCard label="Nouveaux ce mois" value="-" icon={UserPlus} accent="info" />
        <StatCard label="Clients fidèles" value="-" icon={Heart} accent="danger" />
      </div>

      <Card>
        <div className="border-b border-gray-100 p-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un client par nom ou téléphone…" className="max-w-md" />
        </div>
        <CardHeader title="Liste des clients" subtitle={`${filtered.length} client(s)`} />
        {loading ? (
          <div className="p-10"><Spinner label="Chargement des clients..." /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Aucun client trouvé" description="Aucun client ne correspond à votre recherche." />
        ) : (
          <Table headers={["Client", "Téléphone", "Commandes", "Montant dépensé", "Dernière commande", ""]}>
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} />
                    <span className="font-semibold text-gray-900">{c.name}</span>
                  </div>
                </Td>
                <Td className="text-gray-500">{c.phone}</Td>
                <Td>{c.orders_count || c.orders || 0}</Td>
                <Td className="font-semibold text-gray-900">{fmt(c.total_spent || c.spent || 0)}</Td>
                <Td className="text-gray-500">
                  {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("fr-FR") : c.last || "-"}
                </Td>
                <Td>
                  <Link to={`/dashboard/customers/${c.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-primary-50 hover:text-primary-600" title="Voir la fiche">
                    <ArrowRight size={16} />
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
