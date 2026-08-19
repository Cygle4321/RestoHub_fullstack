import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { UtensilsCrossed, Star, Plus, SearchX } from "lucide-react";
import { Badge, Card, SearchInput, EmptyState, Spinner, useToast } from "../../components/ui";
import { useCart } from "../../store/CartContext";
import { useStore } from "../../store/StoreContext";
import { fmt } from "../../lib/mappers";

export default function StoreMenu() {
  const { slug, loading, error, products, catNames } = useStore();
  const [params] = useSearchParams();
  const initialCat = params.get("cat") || "Tout";
  const initialQuery = params.get("q") || "";
  const [cat, setCat] = useState("Tout");
  const [query, setQuery] = useState(initialQuery);
  const appliedCat = useRef(false);
  const { add } = useCart();
  const toast = useToast();

  useEffect(() => {
    if (appliedCat.current || catNames.length === 0) return;
    appliedCat.current = true;
    if (initialCat !== "Tout" && catNames.includes(initialCat)) setCat(initialCat);
  }, [catNames, initialCat]);

  const filtered = products.filter((p) => {
    const matchCat = cat === "Tout" || p.category === cat;
    const matchQuery =
      !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery;
  });

  const handleAdd = (product) => {
    add(product, 1);
    toast("Ajouté au panier");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10">
        <EmptyState icon={SearchX} title="Boutique introuvable" description={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-5">
      <h1 className="text-xl font-bold tracking-tight text-zinc-900">Menu</h1>
      <p className="mt-0.5 text-sm text-zinc-500">{products.length} plats disponibles</p>

      <div className="sticky top-[60px] z-10 -mx-4 mt-4 space-y-3 border-b border-zinc-100 bg-[#fafafa]/95 px-4 py-3 backdrop-blur-md">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un plat…" />
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {catNames.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                cat === c
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-600 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Aucun plat trouvé"
          description="Essayez une autre catégorie ou modifiez votre recherche."
        />
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <Card key={p.id} className="group flex flex-col overflow-hidden" hover>
              <Link to={`/store/${slug}/product/${p.id}`} className="block">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 to-orange-50 text-primary-300 transition group-hover:from-primary-100 group-hover:to-orange-100">
                  {p.image ? (
                    <img src={p.image} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <UtensilsCrossed size={32} strokeWidth={1.25} />
                  )}
                  {p.featured && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary-600 shadow-xs backdrop-blur">
                      <Star size={9} className="fill-current" /> Populaire
                    </span>
                  )}
                </div>
              </Link>
              <div className="flex flex-1 flex-col p-3.5">
                <Link to={`/store/${slug}/product/${p.id}`}>
                  <h3 className="line-clamp-1 text-[13px] font-semibold text-zinc-900 transition group-hover:text-primary-700">
                    {p.name}
                  </h3>
                </Link>
                <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-zinc-500">
                  {p.description}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-zinc-900">{fmt(p.price)}</span>
                  {!p.available && (
                    <Badge variant="danger">Épuisé</Badge>
                  )}
                </div>
                <button
                  onClick={() => handleAdd(p)}
                  disabled={!p.available}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-500 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} strokeWidth={2.5} /> Ajouter
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
