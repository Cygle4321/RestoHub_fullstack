import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, UtensilsCrossed, Star, Minus, Plus, ShoppingBag } from "lucide-react";
import { Badge, Button, EmptyState, Spinner, useToast } from "../../components/ui";
import { useCart } from "../../store/CartContext";
import { useStore } from "../../store/StoreContext";
import { fmt } from "../../lib/mappers";
import SEO from "../../components/common/SEO";
import { generateMenuItemSchema } from "../../lib/seoSchemas";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { slug, loading, error, products, restaurant } = useStore();
  const product = products.find((p) => p.id === Number(id));
  const { add } = useCart();
  const toast = useToast();

  const [qty, setQty] = useState(1);
  const [choices, setChoices] = useState({});
  const [supps, setSupps] = useState([]);

  useEffect(() => {
    const init = {};
    product?.options?.forEach((o) => (init[o.name] = o.choices[0]));
    setChoices(init);
    setSupps([]);
  }, [product]);

  const supplementsTotal = useMemo(
    () => (product?.supplements || []).filter((s) => supps.includes(s.name)).reduce((sum, s) => sum + s.price, 0),
    [supps, product]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="Produit introuvable"
        description="Ce produit n'existe pas ou n'est plus disponible."
        action={<Button onClick={() => navigate(`/store/${slug}/menu`)}>Retour au menu</Button>}
      />
    );
  }

  const unitPrice = product.price + supplementsTotal;
  const total = unitPrice * qty;

  const toggleSupp = (name) =>
    setSupps((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]));

  const handleAdd = () => {
    add(
      {
        ...product,
        price: unitPrice,
        options: Object.entries(choices).map(([name, choice]) => ({ name, choice })),
        supplements: (product.supplements || []).filter((s) => supps.includes(s.name)),
      },
      qty
    );
    toast("Ajouté au panier");
    navigate(`/store/${slug}/menu`);
  };

  const productUrl = typeof window !== "undefined" ? window.location.href : `https://restohub.app/store/${slug}/product/${id}`;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4">
      <SEO
        title={`${product.name} — ${restaurant?.name || "Restaurant"}`}
        exactTitle
        description={
          product.description ||
          `Dégustez ${product.name} au prix de ${fmt(product.price)} chez ${restaurant?.name || "RestoHub"}. Commandez en ligne dès maintenant.`
        }
        image={product.image || restaurant?.logo}
        url={productUrl}
        type="product"
        jsonLd={generateMenuItemSchema(product, restaurant, productUrl)}
      />
      <button
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
      >
        <ChevronLeft size={18} /> Retour
      </button>

      {/* Photo */}
      {product.image ? (
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="h-48 w-full rounded-xl object-cover md:h-64" />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl bg-primary-50 text-primary-400 md:h-64">
          <UtensilsCrossed size={56} />
        </div>
      )}

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-zinc-900">{product.name}</h1>
          {product.category && <Badge variant="primary">{product.category}</Badge>}
          {product.featured && (
            <Badge variant="warning">
              <Star size={12} className="fill-current" /> Populaire
            </Badge>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{product.description}</p>
        <p className="mt-3 text-2xl font-extrabold text-primary-600">{fmt(product.price)}</p>
      </div>

      {/* Options (choix requis, premier sélectionné par défaut) */}
      {product.options?.map((opt) => (
        <div key={opt.name} className="mt-6">
          <h2 className="text-sm font-bold text-zinc-900">
            {opt.name} <span className="font-normal text-zinc-400">(obligatoire)</span>
          </h2>
          <div className="mt-2 space-y-2">
            {opt.choices.map((c) => (
              <label
                key={c}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                  choices[opt.name] === c ? "border-primary-500 bg-primary-50 text-primary-900" : "border-zinc-200 text-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name={opt.name}
                  checked={choices[opt.name] === c}
                  onChange={() => setChoices((p) => ({ ...p, [opt.name]: c }))}
                  className="h-4 w-4 accent-primary-600"
                />
                {c}
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Supplements */}
      {product.supplements?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-zinc-900">
            Suppléments <span className="font-normal text-zinc-400">(optionnel)</span>
          </h2>
          <div className="mt-2 space-y-2">
            {product.supplements.map((s) => (
              <label
                key={s.name}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                  supps.includes(s.name) ? "border-primary-500 bg-primary-50 text-primary-900" : "border-zinc-200 text-zinc-700"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={supps.includes(s.name)}
                    onChange={() => toggleSupp(s.name)}
                    className="h-4 w-4 accent-primary-600"
                  />
                  {s.name}
                </span>
                <span className="font-semibold text-primary-600">+{fmt(s.price)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Barre sticky */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-300 px-2 py-1.5">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100"
              aria-label="Diminuer"
            >
              <Minus size={16} />
            </button>
            <span className="w-6 text-center text-sm font-bold text-zinc-900">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100"
              aria-label="Augmenter"
            >
              <Plus size={16} />
            </button>
          </div>
          <Button onClick={handleAdd} className="flex-1">
            <ShoppingBag size={16} />
            Ajouter · {fmt(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}