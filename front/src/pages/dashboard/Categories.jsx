import { useState, useEffect } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardHeader, Input, Modal, Table, Td, Toggle, useToast, Spinner } from "../../components/ui";
import { restaurantApi } from "../../api/restaurant";

export default function Categories() {
  const toast = useToast();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await restaurantApi.categories();
        if (!cancelled) setCats((res.data || res || []).map((c) => ({ ...c, count: c.products_count ?? 0, active: c.is_active ?? c.active })));
      } catch {
        if (!cancelled) setCats([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openNew = () => { setEditing(null); setName(""); setModal(true); };
  const openEdit = (c) => { setEditing(c); setName(c.name); setModal(true); };

  const save = async () => {
    if (!name.trim()) return toast("Le nom de la catégorie est requis", "error");
    try {
      if (editing) {
        await restaurantApi.updateCategory(editing.id, { name, is_active: editing.active });
        setCats((l) => l.map((c) => (c.id === editing.id ? { ...c, name, active: editing.active } : c)));
        toast(`Catégorie « ${name} » mise à jour`);
      } else {
        const res = await restaurantApi.createCategory({ name, is_active: true });
        const newCat = res.data || res;
        setCats((l) => [...l, { ...newCat, count: 0, active: true }]);
        toast(`Catégorie « ${name} » créée`);
      }
      setModal(false);
    } catch {
      toast("Erreur lors de l'enregistrement", "error");
    }
  };

  const move = async (i, dir) => {
    const current = cats;
    const n = [...current];
    const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    setCats(n);
    const reordered = n.map((c, idx) => ({ ...c, sort_order: idx }));
    try {
      await Promise.all(reordered.map((c) => restaurantApi.updateCategory(c.id, { sort_order: c.sort_order })));
    } catch {
      toast("Erreur lors de la réorganisation", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      await restaurantApi.deleteCategory(toDelete.id);
      setCats((l) => l.filter((c) => c.id !== toDelete.id));
      toast(`Catégorie « ${toDelete.name} » supprimée`, "error");
    } catch {
      toast("Erreur lors de la suppression", "error");
    }
    setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Catégories</h1>
          <p className="mt-1 text-sm text-gray-500">Organisez votre menu et l'ordre d'affichage.</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Nouvelle catégorie</Button>
      </div>

      <Card>
        <CardHeader title="Liste des catégories" subtitle={`${cats.length} catégories`} />
        {loading ? (
          <div className="flex h-40 items-center justify-center"><Spinner label="Chargement..." /></div>
        ) : (
        <Table headers={["Catégorie", "Produits", "Statut", "Actions"]}>
          {cats.map((c, i) => (
            <tr key={c.id} className="hover:bg-gray-50/60">
              <Td className="font-semibold text-gray-900">{c.name}</Td>
              <Td>{c.count}</Td>
              <Td><Badge variant={c.active ? "success" : "neutral"} dot>{c.active ? "Active" : "Inactive"}</Badge></Td>
              <Td>
                <div className="flex items-center gap-1">
                  <button disabled={i === 0} onClick={() => move(i, -1)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30" title="Monter"><ArrowUp size={16} /></button>
                  <button disabled={i === cats.length - 1} onClick={() => move(i, 1)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30" title="Descendre"><ArrowDown size={16} /></button>
                  <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-primary-50 hover:text-primary-600" title="Modifier"><Pencil size={16} /></button>
                  <button onClick={() => setToDelete(c)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-danger-50 hover:text-danger-600" title="Supprimer"><Trash2 size={16} /></button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
        )}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Annuler</Button>
            <Button onClick={save}>{editing ? "Enregistrer" : "Créer"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nom de la catégorie" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Desserts" autoFocus />
          {editing && <Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label="Catégorie active" />}
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Supprimer la catégorie"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>Annuler</Button>
            <Button variant="danger" onClick={confirmDelete}>Supprimer</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Supprimer « <span className="font-semibold text-gray-900">{toDelete?.name}</span> » ? Les produits associés devront être reclassés.</p>
      </Modal>
    </div>
  );
}
