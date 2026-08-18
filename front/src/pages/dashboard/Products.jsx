import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, SearchX, Star, Trash2, UtensilsCrossed } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  SearchInput,
  Spinner,
  Tabs,
  useToast,
  PageHeader,
} from "../../components/ui";
import { restaurantApi } from "../../api/restaurant";
import { fmt } from "../../lib/mappers";

export default function Products() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Toutes");
  const [view, setView] = useState("Grille");
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prods, cats] = await Promise.all([
          restaurantApi.products(),
          restaurantApi.categories(),
        ]);
        if (cancelled) return;
        setItems((prods.data || prods || []).map((p) => ({
          ...p,
          available: p.available ?? p.is_available,
          featured: p.featured ?? p.is_featured,
          category: typeof p.category === "string" ? p.category : p.category?.name,
        })));
        setCategories(
          (Array.isArray(cats) ? cats : cats.data || []).map((c) => ({
            id: c.id,
            name: c.name,
            count: c.products_count,
            active: c.is_active,
          }))
        );
      } catch {
        if (!cancelled) {
          setItems([]);
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = items.filter(
    (p) =>
      (cat === "Toutes" || p.category === cat) &&
      (query === "" || p.name.toLowerCase().includes(query.toLowerCase()))
  );

  const confirmDelete = async () => {
    try {
      await restaurantApi.deleteProduct(toDelete.id);
    } catch {
      /* still remove locally if offline */
    }
    setItems((list) => list.filter((p) => p.id !== toDelete.id));
    toast(`Produit « ${toDelete.name} » supprimé`, "error");
    setToDelete(null);
  };

  const catTabs = ["Toutes", ...categories.map((c) => c.name)];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produits"
        subtitle={`${items.length} produits dans votre catalogue`}
        actions={
          <Link to="/dashboard/products/new">
            <Button>
              <Plus size={16} strokeWidth={2} /> Nouveau produit
            </Button>
          </Link>
        }
      />

      {/* Mini stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: items.length },
          { label: "Disponibles", value: items.filter((p) => p.available).length },
          { label: "Vedettes", value: items.filter((p) => p.featured).length },
          { label: "En rupture", value: items.filter((p) => !p.available).length, danger: true },
        ].map((s) => (
          <Card key={s.label} className="px-5 py-4">
            <p className="text-[13px] font-medium text-zinc-500">{s.label}</p>
            <p
              className={`mt-1 text-2xl font-bold tracking-tight ${
                s.danger ? "text-danger-600" : "text-zinc-900"
              }`}
            >
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Rechercher un produit…"
          className="min-w-[240px] flex-1"
        />
        <Tabs tabs={["Grille", "Liste"]} active={view} onChange={setView} />
      </div>

      {loading ? (
        <Card>
          <Spinner label="Chargement des produits…" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="Aucun produit trouvé"
            description="Aucun produit ne correspond à votre recherche ou filtre."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setCat("Toutes");
                }}
              >
                Réinitialiser les filtres
              </Button>
            }
          />
        </Card>
      ) : view === "Grille" ? (
        <>
          <Tabs tabs={catTabs} active={cat} onChange={setCat} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((p) => (
              <Card key={p.id} className="group overflow-hidden" hover>
                <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-300">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed size={32} strokeWidth={1.25} />
                  )}
                  {p.featured && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow-xs">
                      <Star size={10} fill="currentColor" /> Vedette
                    </span>
                  )}
                </div>
                <div className="space-y-2.5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-zinc-900">{p.name}</p>
                    <Badge variant="neutral">{p.category}</Badge>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {p.description}
                  </p>
                  <div className="flex items-center justify-between pt-0.5">
                    <p className="text-base font-bold text-zinc-900">{fmt(p.price)}</p>
                    <Badge variant={p.available ? "success" : "danger"} dot>
                      {p.available ? "Disponible" : "Rupture"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                    <Link
                      to={`/dashboard/products/${p.id}/edit`}
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-600 hover:text-primary-700"
                    >
                      <Pencil size={13} /> Modifier
                    </Link>
                    <button
                      onClick={() => setToDelete(p)}
                      className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-danger-50 hover:text-danger-600"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="border-b border-zinc-100 px-4 py-3">
            <Tabs tabs={catTabs} active={cat} onChange={setCat} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Produit
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Catégorie
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Prix
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Disponibilité
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition hover:bg-zinc-50/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-zinc-400">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <UtensilsCrossed size={16} strokeWidth={1.5} />
                        )}
                      </span>
                        <div>
                          <p className="font-semibold text-zinc-900">
                            {p.name}{" "}
                            {p.featured && (
                              <Star size={11} className="ml-0.5 inline fill-amber-400 text-amber-400" />
                            )}
                          </p>
                          <p className="line-clamp-1 max-w-xs text-xs text-zinc-400">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="neutral">{p.category}</Badge>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-zinc-900">{fmt(p.price)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={p.available ? "success" : "danger"} dot>
                        {p.available ? "Disponible" : "Rupture"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/dashboard/products/${p.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-primary-600 hover:bg-primary-50"
                        >
                          <Pencil size={13} /> Modifier
                        </Link>
                        <button
                          onClick={() => setToDelete(p)}
                          className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-danger-50 hover:text-danger-600"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Supprimer le produit"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600">
          Êtes-vous sûr de vouloir supprimer «{" "}
          <span className="font-semibold text-zinc-900">{toDelete?.name}</span> » ? Cette action
          est définitive.
        </p>
      </Modal>
    </div>
  );
}
