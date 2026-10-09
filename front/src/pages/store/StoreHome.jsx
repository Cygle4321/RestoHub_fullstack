import { Link } from "react-router-dom";
import { UtensilsCrossed, Bike, Plus, MapPin, ArrowRight, Star } from "lucide-react";
import { Badge, Card, Button, Spinner, EmptyState, useToast } from "../../components/ui";
import { useCart } from "../../store/CartContext";
import { useStore, initialsOf } from "../../store/StoreContext";
import { fmt } from "../../lib/mappers";
import SEO from "../../components/common/SEO";
import { generateRestaurantSchema } from "../../lib/seoSchemas";

function ProductCard({ product, onAdd }) {
  const { slug } = useStore();
  return (
    <Card className="group overflow-hidden" hover>
      <Link to={`/store/${slug}/product/${product.id}`} className="block">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 to-orange-50 text-primary-300 transition group-hover:from-primary-100 group-hover:to-orange-100">
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition group-hover:scale-105" />
          ) : (
            <UtensilsCrossed size={36} strokeWidth={1.25} />
          )}
          {product.featured && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary-600 shadow-xs backdrop-blur">
              <Star size={9} className="fill-current" /> Populaire
            </span>
          )}
        </div>
      </Link>
      <div className="p-3.5">
        <Link to={`/store/${slug}/product/${product.id}`}>
          <h3 className="line-clamp-1 text-[13px] font-semibold text-zinc-900 transition group-hover:text-primary-700">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-zinc-900">{fmt(product.price)}</p>
          <button
            onClick={() => onAdd(product)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm transition hover:bg-primary-600 hover:scale-105 active:scale-95"
            aria-label={`Ajouter ${product.name}`}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function StoreHome() {
  const { slug, loading, error, restaurant, products, categories, zones, catNames } = useStore();
  const { add } = useCart();
  const toast = useToast();

  const popular = products.filter((p) => p.featured);
  const firstZone = zones[0];

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

  if (error || !restaurant) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10">
        <EmptyState icon={UtensilsCrossed} title="Boutique introuvable" description={error || "Aucune donnée disponible."} />
      </div>
    );
  }

  const storeUrl = typeof window !== "undefined" ? window.location.href : `https://restohub.app/store/${slug}`;
  const restaurantSchema = generateRestaurantSchema(restaurant, storeUrl);

  return (
    <div className="pb-8">
      <SEO
        title={`${restaurant.name} — Menu, Commande & Livraison en Ligne`}
        exactTitle
        description={
          restaurant.description ||
          `Boutique en ligne et menu digital de ${restaurant.name} (${restaurant.city || "Abidjan"}). Commandez vos plats préférés avec livraison rapide et paiement sécurisé.`
        }
        image={restaurant.cover || restaurant.logo}
        url={storeUrl}
        type="restaurant"
        jsonLd={restaurantSchema}
      />
      {/* Cover */}
      <div className="relative h-44 overflow-hidden sm:h-56 md:h-64">
        {restaurant.cover ? (
          <img src={restaurant.cover} alt="Couverture" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${restaurant.color || "#14b8a6"} 0%, #1a1a1a 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-5 left-0 right-0 mx-auto max-w-5xl px-4">
          <div className="flex items-end gap-4">
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt={`Logo ${restaurant.name}`}
                className="h-16 w-16 shrink-0 rounded-2xl bg-white object-cover shadow-float ring-4 ring-white/20 sm:h-20 sm:w-20"
              />
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-float ring-4 ring-white/20 sm:h-20 sm:w-20"
                style={{ backgroundColor: restaurant.color || "#14b8a6" }}
              >
                {initialsOf(restaurant.name)}
              </div>
            )}
            <div className="pb-1 text-white">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="mt-0.5 line-clamp-1 text-sm text-white/70">{restaurant.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3.5 sm:gap-3">
          {restaurant.is_open !== undefined && (
            <Badge variant={restaurant.is_open ? "success" : "danger"} dot>
              {restaurant.is_open ? "Ouvert" : "Fermé"}
            </Badge>
          )}
          {Number(restaurant.rating_count) > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {restaurant.rating_avg} · {restaurant.rating_count} avis
            </span>
          )}
          {firstZone && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <Bike size={12} strokeWidth={2} /> Livraison {fmt(firstZone.fee)}
              {firstZone.delay ? ` · ${firstZone.delay}` : ""}
            </span>
          )}
          <div className="ml-auto hidden sm:flex sm:gap-2">
            <Link to={`/store/${slug}/menu`}>
              <Button size="sm">Voir le menu</Button>
            </Link>
            <Link to={`/store/${slug}/track`}>
              <Button variant="secondary" size="sm">
                Suivre ma commande
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-10 px-4 pt-8">
        {/* Categories — horizontal scroll */}
        {catNames.length > 1 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-zinc-900">Catégories</h2>
            </div>
            <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none">
              {catNames
                .filter((c) => c !== "Tout")
                .map((c) => (
                  <Link
                    key={c}
                    to={`/store/${slug}/menu?cat=${encodeURIComponent(c)}`}
                    className="group flex shrink-0 items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 shadow-xs transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition group-hover:bg-primary-100 group-hover:text-primary-600">
                      <UtensilsCrossed size={14} strokeWidth={1.75} />
                    </span>
                    {c}
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* Popular products */}
        {popular.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-zinc-900">Populaires</h2>
              <Link
                to={`/store/${slug}/menu`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Tout voir <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {popular.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={handleAdd} />
              ))}
            </div>
          </section>
        )}

        {/* Tous les produits — groupés par catégorie */}
        {products.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-zinc-900">Tous les produits</h2>
              {popular.length > 0 && (
                <Link
                  to={`/store/${slug}/menu`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  Menu complet <ArrowRight size={14} />
                </Link>
              )}
            </div>
            <div className="space-y-8">
              {categories.map((cat) => {
                const catProducts = products.filter((p) => p.category_id === cat.id);
                if (catProducts.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <h3 className="mb-3 text-sm font-bold tracking-tight text-zinc-500">{cat.name}</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                      {catProducts.map((p) => (
                        <ProductCard key={p.id} product={p} onAdd={handleAdd} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {(() => {
                const uncategorized = products.filter(
                  (p) => !categories.some((c) => c.id === p.category_id)
                );
                if (uncategorized.length === 0) return null;
                return (
                  <div>
                    <h3 className="mb-3 text-sm font-bold tracking-tight text-zinc-500">Autres</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                      {uncategorized.map((p) => (
                        <ProductCard key={p.id} product={p} onAdd={handleAdd} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* Mobile CTAs */}
        <div className="flex gap-3 sm:hidden">
          <Link to={`/store/${slug}/menu`} className="flex-1">
            <Button className="w-full">Voir le menu</Button>
          </Link>
          <Link to={`/store/${slug}/track`} className="flex-1">
            <Button variant="secondary" className="w-full">
              Suivre
            </Button>
          </Link>
        </div>

        {restaurant.address && (
          <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-zinc-400">
            <MapPin size={12} strokeWidth={2} /> {restaurant.address}
          </p>
        )}
      </div>
    </div>
  );
}
