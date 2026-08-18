import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { Badge, Card, EmptyState, SearchInput, Select, Spinner, Table, Td, statusVariant } from "../../components/ui";
import { adminApi } from "../../api/admin";
import { fmt } from "../../lib/mappers";

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [restaurant, setRestaurant] = useState("Tous");
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ord, rest] = await Promise.all([
          adminApi.orders({ per_page: 100 }),
          adminApi.restaurants({ per_page: 100 }),
        ]);
        if (cancelled) return;
        const list = ord.data || ord;
        setOrders(Array.isArray(list) ? list : []);
        setTotal(ord.total ?? (Array.isArray(list) ? list.length : 0));
        const rl = rest.data || rest;
        setRestaurants(Array.isArray(rl) ? rl : []);
      } catch {
        if (!cancelled) { setOrders([]); setRestaurants([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const match =
      (o.number || "").toLowerCase().includes(q) ||
      (o.customer?.name || "").toLowerCase().includes(q);
    return match && (restaurant === "Tous" || o.restaurant?.name === restaurant);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Commandes</h1>

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par n° de commande ou client…" className="flex-1" />
          <Select value={restaurant} onChange={(e) => setRestaurant(e.target.value)} className="sm:w-56">
            <option>Tous</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </Select>
        </div>
        {loading ? (
          <div className="p-6"><Spinner label="Chargement des commandes…" /></div>
        ) : (
          <>
            <Table headers={["N°", "Restaurant", "Client", "Date", "Statut", "Total"]} empty={filtered.length === 0}>
              {filtered.map((o) => (
                <tr key={o._id ?? o.id} className="hover:bg-gray-50">
                  <Td className="font-mono text-xs">{o.number}</Td>
                  <Td className="font-semibold text-gray-900">{o.restaurant?.name || "—"}</Td>
                  <Td>{o.customer?.name || "—"}</Td>
                  <Td>{o.date || "—"}</Td>
                  <Td><Badge variant={statusVariant(o.status)} dot>{o.status}</Badge></Td>
                  <Td className="font-semibold text-gray-900">{fmt(o.total)}</Td>
                </tr>
              ))}
            </Table>
            {filtered.length === 0 && <EmptyState icon={ReceiptText} title="Aucune commande" description="Aucune commande ne correspond à votre recherche." />}
            <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
              Affichage {filtered.length} sur {total}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}