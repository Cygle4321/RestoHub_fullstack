import { useState, useEffect } from "react";
import { Percent, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select, Tabs, Toggle, useToast, Spinner } from "../../components/ui";
import { restaurantApi } from "../../api/restaurant";

const TYPE_META = {
  percent: { label: "Pourcentage", short: "%" },
  fixed: { label: "Réduction fixe", short: "FCFA" },
  free_delivery: { label: "Livraison offerte", short: "Livraison" },
};
const TYPE_ORDER = ["Toutes", ...Object.values(TYPE_META).map((t) => t.label)];

export default function Promotions() {
  const toast = useToast();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Toutes");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percent", value: "", usage_limit: "", ends_at: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await restaurantApi.promotions();
        if (!cancelled) setPromos(res.data || res || []);
      } catch {
        if (!cancelled) setPromos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const typeLabel = (p) => TYPE_META[p.type]?.label || p.type;

  const filtered = tab === "Toutes" ? promos : promos.filter((p) => typeLabel(p) === tab);

  const save = async () => {
    if (!form.code.trim()) return toast("Le code est requis", "error");
    try {
      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value) || 0,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        ends_at: form.ends_at || null,
        is_active: true,
      };
      const res = await restaurantApi.createPromotion(payload);
      const newPromo = res.data || res;
      setPromos((l) => [...l, newPromo]);
      toast(`Promotion « ${form.code.toUpperCase()} » créée`);
      setForm({ code: "", type: "percent", value: "", usage_limit: "", ends_at: "" });
      setModal(false);
    } catch (e) {
      toast(e?.message || "Erreur lors de la création", "error");
    }
  };

  const remove = async (id, code) => {
    try {
      await restaurantApi.deletePromotion(id);
      setPromos((l) => l.filter((x) => x.id !== id));
      toast(`Promotion « ${code} » supprimée`, "error");
    } catch {
      toast("Erreur lors de la suppression", "error");
    }
  };

  const toggleActive = async (id, current, code) => {
    try {
      await restaurantApi.updatePromotion(id, { is_active: !current });
      setPromos((l) => l.map((x) => (x.id === id ? { ...x, is_active: !current } : x)));
      toast(!current ? `Promotion « ${code} » activée` : `Promotion « ${code} » désactivée`, !current ? "success" : "error");
    } catch {
      toast("Erreur de mise à jour", "error");
    }
  };

  const describe = (p) => {
    if (p.type === "percent") return `-${p.value}%`;
    if (p.type === "fixed") return `-${Number(p.value).toLocaleString("fr-FR")} FCFA`;
    return "Livraison offerte";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Promotions</h1>
          <p className="mt-1 text-sm text-gray-500">Boostez vos ventes avec des offres attractives.</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus size={16} /> Nouvelle promotion</Button>
      </div>

      <Tabs tabs={TYPE_ORDER} active={tab} onChange={setTab} />

      {loading ? (
        <Card className="p-10 flex justify-center"><Spinner label="Chargement des promotions..." /></Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-gray-500">Aucune promotion dans cette catégorie.</Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const limit = p.usage_limit;
            const usage = p.usage_count ?? 0;
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><Percent size={18} /></span>
                    <div>
                      <p className="font-mono text-sm font-bold tracking-wide text-gray-900">{p.code}</p>
                      <Badge variant="primary">{typeLabel(p)}</Badge>
                    </div>
                  </div>
                  <button onClick={() => remove(p.id, p.code)} className="rounded-lg p-1.5 text-gray-400 hover:bg-danger-50 hover:text-danger-600" title="Supprimer">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-700">{describe(p)}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Utilisation</span>
                    <span className="font-semibold text-gray-700">{usage} / {limit ?? "∞"}</span>
                  </div>
                  {limit ? (
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, (usage / limit) * 100)}%` }} />
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500">Valide jusqu'au <span className="font-semibold text-gray-700">{p.ends_at ? new Date(p.ends_at).toLocaleDateString("fr-FR") : "—"}</span></p>
                  <Toggle checked={p.is_active} onChange={() => toggleActive(p.id, p.is_active, p.code)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Nouvelle promotion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Annuler</Button>
            <Button onClick={save}>Créer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="Ex : BIENVENUE10" className="font-mono uppercase" />
          <Select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="percent">Pourcentage</option>
            <option value="fixed">Réduction fixe (FCFA)</option>
            <option value="free_delivery">Livraison offerte</option>
          </Select>
          {form.type !== "free_delivery" && (
            <Input label={form.type === "percent" ? "Valeur (%)" : "Valeur (FCFA)"} type="number" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder={form.type === "percent" ? "10" : "1000"} />
          )}
          <Input label="Limite d'utilisation" type="number" min="1" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))} placeholder="200" />
          <Input label="Valide jusqu'au" type="date" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}