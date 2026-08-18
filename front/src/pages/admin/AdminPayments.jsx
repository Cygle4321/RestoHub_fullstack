import { useEffect, useState } from "react";
import { Banknote, Calendar, XCircle, RotateCcw } from "lucide-react";
import { Badge, Button, Card, Modal, SearchInput, Select, Spinner, StatCard, Table, Td, statusVariant, useToast } from "../../components/ui";
import { adminApi } from "../../api/admin";
import { fmt } from "../../lib/mappers";

const STATUS_UI = {
  approved: "Réussi",
  declined: "Échoué",
  pending: "En attente",
  canceled: "Annulé",
  cancelled: "Annulé",
  refunded: "Remboursé",
};

const METHOD_UI = {
  mobile_money: "Mobile Money",
  card: "Carte bancaire",
  cash: "Paiement à la livraison",
};

export default function AdminPayments() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Tous");
  const [method, setMethod] = useState("Toutes méthodes");
  const [refund, setRefund] = useState(null);
  const [refunding, setRefunding] = useState(false);

  const confirmRefund = async () => {
    if (!refund) return;
    setRefunding(true);
    try {
      await adminApi.refundPayment(refund.id);
      toast(`${fmt(refund.amount)} remboursé`, "error");
      setItems((prev) => prev.map((p) => (p.id === refund.id ? { ...p, status: "refunded" } : p)));
      setRefund(null);
    } catch (e) {
      toast(e?.message || "Erreur lors du remboursement", "error");
    } finally {
      setRefunding(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    adminApi
      .payments({ per_page: 100 })
      .then((data) => {
        const list = data.data || data;
        if (!cancelled) setItems(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const totalEncaisse = items.filter((p) => p.status === "approved").reduce((s, p) => s + (p.amount || 0), 0);
  const thisMonth = items
    .filter((p) => p.status === "approved" && new Date(p.created_at).getMonth() === new Date().getMonth())
    .reduce((s, p) => s + (p.amount || 0), 0);
  const failed = items.filter((p) => p.status === "declined").length;
  const refundedCount = items.filter((p) => p.status === "refunded").length;

  const filtered = items.filter((t) => {
    const q = search.toLowerCase();
    const id = String(t.provider_ref || t.id || "").toLowerCase();
    const rest = (t.restaurant?.name || "").toLowerCase();
    const st = STATUS_UI[t.status] || t.status;
    const m = METHOD_UI[t.method] || t.method || "—";
    return (
      (id.includes(q) || rest.includes(q)) &&
      (status === "Tous" || st === status) &&
      (method === "Toutes méthodes" || m === method)
    );
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Paiements</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total encaissé" value={fmt(totalEncaisse)} icon={Banknote} accent="success" />
        <StatCard label="Ce mois" value={fmt(thisMonth)} icon={Calendar} />
        <StatCard label="Échecs" value={String(failed)} icon={XCircle} accent="danger" />
        <StatCard label="Remboursements" value={String(refundedCount)} icon={RotateCcw} accent="info" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une transaction…" className="flex-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
            <option>Tous</option>
            <option>Réussi</option>
            <option>En attente</option>
            <option>Échoué</option>
            <option>Remboursé</option>
            <option>Annulé</option>
          </Select>
          <Select value={method} onChange={(e) => setMethod(e.target.value)} className="sm:w-48">
            <option>Toutes méthodes</option>
            <option>Mobile Money</option>
            <option>Carte bancaire</option>
            <option>Paiement à la livraison</option>
          </Select>
        </div>
        {loading ? (
          <div className="p-6"><Spinner label="Chargement des paiements…" /></div>
        ) : (
          <Table headers={["Transaction", "Restaurant", "Montant", "Méthode", "Statut", "Date", ""]} empty={filtered.length === 0}>
            {filtered.map((t) => {
              const st = STATUS_UI[t.status] || t.status;
              const m = METHOD_UI[t.method] || t.method || "—";
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <Td className="font-mono text-xs">{t.provider_ref || t.id}</Td>
                  <Td className="font-semibold text-gray-900">{t.restaurant?.name || "—"}</Td>
                  <Td className="font-semibold text-gray-900">{fmt(t.amount)}</Td>
                  <Td>{m}</Td>
                  <Td><Badge variant={statusVariant(st)} dot>{st}</Badge></Td>
                  <Td>{t.created_at ? new Date(t.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</Td>
                  <Td>
                    {t.status === "approved" && (
                      <button
                        onClick={() => setRefund(t)}
                        className="inline-flex items-center gap-1.5 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        title="Rembourser"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Modal
        open={!!refund}
        onClose={() => setRefund(null)}
        title="Rembourser la transaction"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefund(null)}>Annuler</Button>
            <Button variant="danger" onClick={confirmRefund} disabled={refunding}>
              {refunding ? "Remboursement…" : "Confirmer le remboursement"}
            </Button>
          </>
        }
      >
        {refund && (
          <p className="text-sm text-gray-600">
            Voulez-vous rembourser <strong>{fmt(refund.amount)}</strong> à <strong>{refund.restaurant?.name}</strong> (transaction {refund.provider_ref || refund.id}) ?
          </p>
        )}
      </Modal>
    </div>
  );
}