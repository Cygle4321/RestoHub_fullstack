import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, Trash2, Minus, Plus, ShoppingBag, Tag } from "lucide-react";
import { Card, Button, Input, EmptyState } from "../../components/ui";
import { useCart } from "../../store/CartContext";
import { useStore } from "../../store/StoreContext";
import { fmt } from "../../lib/mappers";

export default function Cart() {
  const { items, setQty, remove, clear, total } = useCart();
  const { slug } = useStore();
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  if (items.length === 0) {
    return (
      <Card className="mx-auto mt-8 max-w-2xl">
        <EmptyState
          icon={ShoppingBag}
          title="Votre panier est vide"
          description="Parcourez le menu et ajoutez vos plats favoris."
          action={<Button onClick={() => navigate(`/store/${slug}/menu`)}>Voir le menu</Button>}
        />
      </Card>
    );
  }

  const goToCheckout = () => {
    navigate(`/store/${slug}/checkout`, {
      state: code.trim() ? { promoCode: code.trim() } : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-4">
      <h1 className="text-xl font-bold text-zinc-900">Mon panier ({items.length})</h1>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="flex gap-3 p-3">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-400">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <UtensilsCrossed size={24} />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-zinc-900">{item.name}</h3>
                  <p className="text-xs text-zinc-500">{fmt(item.price)} / unité</p>
                  {(item.options?.length > 0 || item.supplements?.length > 0) && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-400">
                      {[
                        ...(item.options || []).map((o) => `${o.name}: ${o.choice}`),
                        ...(item.supplements || []).map((s) => `+ ${s.name}`),
                      ].join(" · ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="rounded-md p-1.5 text-danger-500 transition hover:bg-danger-50"
                  aria-label={`Retirer ${item.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 rounded-lg border border-zinc-300 px-1.5 py-1">
                  <button
                    onClick={() => setQty(item.id, item.qty - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100"
                    aria-label="Diminuer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                  <button
                    onClick={() => setQty(item.id, item.qty + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100"
                    aria-label="Augmenter"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-sm font-bold text-zinc-900">{fmt(item.price * item.qty)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Code promo */}
      <Card className="mt-4 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="Code promo (optionnel)"
              placeholder="Ex : PROMO10"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>
        {code.trim() && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Tag size={12} /> Le code sera vérifié lors de la commande.
          </p>
        )}
      </Card>

      {/* Récapitulatif */}
      <Card className="mt-4 p-4">
        <h2 className="text-sm font-bold text-zinc-900">Récapitulatif</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Sous-total</dt>
            <dd className="font-medium text-zinc-900">{fmt(total)}</dd>
          </div>
          <div className="flex justify-between text-xs text-zinc-400">
            <dt>Livraison</dt>
            <dd>Calculée à l'étape suivante</dd>
          </div>
        </dl>
        <Button className="mt-4 w-full" onClick={goToCheckout}>
          Passer commande
        </Button>
        <Link to={`/store/${slug}/menu`} className="mt-2 block">
          <Button variant="ghost" className="w-full text-danger-600 hover:bg-danger-50 hover:text-danger-700" onClick={clear}>
            Vider le panier
          </Button>
        </Link>
      </Card>
    </div>
  );
}