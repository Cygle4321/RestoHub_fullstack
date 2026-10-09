import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  Ticket,
  BadgePercent,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { Card, Button } from "../../components/ui";
import { useCart } from "../../store/CartContext";
import { useStore } from "../../store/StoreContext";
import { storeApi } from "../../api/store";
import { fmt } from "../../lib/mappers";
import { computeDiscount } from "../../lib/discount";
import SEO from "../../components/common/SEO";

export default function Cart() {
  const { items, setQty, remove, clear, total } = useCart();
  const { slug, restaurant } = useStore();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [promo, setPromo] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const accent = restaurant?.color || "#14b8a6";

  if (items.length === 0) {
    return (
      <Card className="mx-auto mt-10 max-w-xl overflow-hidden text-center">
        <div className="bg-gradient-to-br from-primary-50 to-white px-6 pt-10">
          <span
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-card"
            style={{ color: accent }}
          >
            <ShoppingBag size={36} strokeWidth={1.5} />
          </span>
          <h2 className="mt-5 text-lg font-bold text-zinc-900">Votre panier est vide</h2>
          <p className="mt-1 text-sm text-zinc-500">Parcourez le menu et ajoutez vos plats favoris.</p>
          <Button className="mb-8 mt-5" onClick={() => navigate(`/store/${slug}/menu`)}>
            Voir le menu <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    );
  }

  const freeDelivery = promo?.type === "free_delivery";
  const discount = computeDiscount(promo, total);

  const applyPromo = async () => {
    const value = code.trim().toUpperCase();
    if (!value) {
      setError("Saisissez un code promo d'abord.");
      return false;
    }
    setChecking(true);
    setError("");
    try {
      const res = await storeApi.verifyPromo(slug, { code: value, subtotal: total });
      if (res.valid) {
        setPromo(res);
        return true;
      }
      setPromo(null);
      setError(res.message || "Code promo invalide.");
      return false;
    } catch {
      setError("Impossible de vérifier le code pour le moment. Réessayez.");
      return false;
    } finally {
      setChecking(false);
    }
  };

  const removePromo = () => {
    setPromo(null);
    setCode("");
    setError("");
  };

  const goToCheckout = async () => {
    if (code.trim() && (!promo || promo.code !== code.trim().toUpperCase())) {
      const ok = await applyPromo();
      if (!ok) return;
    }
    navigate(`/store/${slug}/checkout`, {
      state: promo ? { promoCode: promo.code, promo } : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-2">
      <SEO title="Mon Panier" noindex />
      {/* En-tête décoratif */}
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-8 text-white shadow-card sm:px-8"
        style={{ backgroundColor: accent }}
      >
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-14 right-24 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <span className="absolute right-6 top-6 rotate-12 text-white/20 sm:right-12 sm:top-4">
          <Sparkles size={44} strokeWidth={1.25} />
        </span>
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            <ShoppingBag size={13} /> Panier
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            Vos plats, prêts à être commandés
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {items.reduce((s, x) => s + x.qty, 0)} article(s) dans votre panier
          </p>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        {/* Liste des articles */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card
              key={item.id}
              hover
              className="flex items-center gap-3 p-2.5 transition hover:-translate-y-0.5 sm:gap-4 sm:p-4"
            >
              <div className="relative shrink-0">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary-50 text-primary-400 ring-1 ring-primary-100 sm:h-24 sm:w-24">
                  {item.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed size={24} />
                  )}
                </div>
                <span
                  className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm sm:-left-2 sm:-top-2 sm:h-6 sm:w-6 sm:text-[11px]"
                  style={{ backgroundColor: accent }}
                >
                  {index + 1}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col self-stretch">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-bold text-zinc-900 sm:text-sm">{item.name}</h3>
                    <p className="text-[11px] text-zinc-500 sm:text-xs">{fmt(item.price)} / unité</p>
                    {(item.options?.length > 0 || item.supplements?.length > 0) && (
                      <p className="mt-0.5 line-clamp-2 text-[10px] text-zinc-400 sm:text-[11px]">
                        {[
                          ...(item.options || []).map((o) => `${o.name}: ${o.choice}`),
                          ...(item.supplements || []).map((s) => `+ ${s.name}`),
                        ].join(" · ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="shrink-0 rounded-lg p-1.5 text-danger-500 transition hover:bg-danger-50 sm:p-2"
                    aria-label={`Retirer ${item.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-0.5 sm:p-1">
                    <button
                      onClick={() => setQty(item.id, item.qty - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm transition hover:text-zinc-900 sm:h-7 sm:w-7"
                      aria-label="Diminuer"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-5 text-center text-xs font-bold sm:w-6 sm:text-sm">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.id, item.qty + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm transition hover:text-zinc-900 sm:h-7 sm:w-7"
                      aria-label="Augmenter"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-zinc-900 sm:text-base">{fmt(item.price * item.qty)}</span>
                </div>
              </div>
            </Card>
          ))}

          <Link to={`/store/${slug}/menu`} className="block">
            <Button variant="ghost" className="w-full text-primary-600 hover:bg-primary-50 hover:text-primary-700">
              <Plus size={16} /> Ajouter d'autres plats
            </Button>
          </Link>
        </div>

        {/* Ticket récapitulatif */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card className="overflow-hidden">
            {/* Perforation du ticket */}
            <div className="relative h-9" style={{ background: accent }}>
              <div className="absolute -left-3 top-6 h-6 w-6 rounded-full bg-[#fafafa]" />
              <div className="absolute -right-3 top-6 h-6 w-6 rounded-full bg-[#fafafa]" />
              <span className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/90">
                <Ticket size={14} /> Récapitulatif
              </span>
            </div>

            <div className="space-y-4 p-5">
              {/* Code promo */}
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <BadgePercent size={14} /> Code promo
                </p>
                {!promo ? (
                  <>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.toUpperCase());
                          setError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                        placeholder="Ex : PROMO10"
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold uppercase tracking-wider placeholder:font-normal placeholder:normal-case placeholder:text-zinc-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                      />
                      <Button
                        variant="secondary"
                        className="shrink-0 px-4"
                        onClick={applyPromo}
                        disabled={checking || !code.trim()}
                      >
                        {checking ? <Loader2 size={16} className="animate-spin" /> : "Appliquer"}
                      </Button>
                    </div>
                    {error && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger-600">
                        <XCircle size={13} /> {error}
                      </p>
                    )}
                    {!error && (
                      <p className="mt-2 text-[11px] text-zinc-400">
                        Entrez un code pour voir la remise en temps réel dans le total.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-success-200 bg-success-50 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm font-bold text-success-700">
                      <CheckCircle2 size={16} />
                      {promo.code}
                      {promo.type === "percent" && <span className="font-medium">−{promo.value}%</span>}
                      {promo.type === "fixed" && <span className="font-medium">−{fmt(promo.value)}</span>}
                    </span>
                    <button
                      onClick={removePromo}
                      className="rounded-full p-1.5 text-success-700 transition hover:bg-success-100"
                      aria-label="Retirer le code promo"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Totaux */}
              <div className="space-y-2 border-t border-dashed border-zinc-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sous-total</span>
                  <span className="font-semibold text-zinc-900">{fmt(total)}</span>
                </div>

                {promo && !freeDelivery && (
                  <div className="flex justify-between text-success-600">
                    <span className="font-medium">Remise ({promo.code})</span>
                    <span className="font-bold">−{fmt(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Livraison</span>
                  {freeDelivery ? (
                    <span className="font-semibold text-success-600">Offerte avec {promo.code} 🎉</span>
                  ) : (
                    <span>Calculée à l'étape suivante</span>
                  )}
                </div>

                <div className="my-1 border-t border-dashed border-zinc-200" />

                <div className="flex items-end justify-between pt-1">
                  <span className="text-sm font-bold text-zinc-900">Total à payer</span>
                  <span className="text-xl font-black" style={{ color: accent }}>
                    {fmt(total - (freeDelivery ? 0 : discount))}
                  </span>
                </div>
              </div>

              <Button className="w-full" onClick={goToCheckout}>
                Passer commande <ArrowRight size={16} />
              </Button>
              <button
                onClick={() => {
                  clear();
                  removePromo();
                }}
                className="w-full text-center text-xs font-medium text-danger-500 transition hover:text-danger-600"
              >
                Vider le panier
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}