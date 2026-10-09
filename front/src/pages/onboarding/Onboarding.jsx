import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed, Check, ImagePlus, LogOut, ArrowLeft, ArrowRight,
  Store, CreditCard, Palette, Utensils, Rocket, LayoutDashboard, ShoppingCart,
} from "lucide-react";
import { Button, Input, Textarea, Select, useToast, Spinner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { restaurantApi } from "../../api/restaurant";
import { plans, fmt } from "../../data/mock";
import SEO from "../../components/common/SEO";

const stepLabels = ["Restaurant", "Abonnement", "Personnalisation", "Produit", "Publication"];
const stepIcons = [Store, CreditCard, Palette, Utensils, Rocket];
const colors = ["#14b8a6", "#e11d48", "#7c3aed", "#0ea5e9", "#059669", "#f59e0b", "#111827"];
const cuisines = ["Africaine", "Française", "Italienne", "Asiatique", "Fast-food", "Végétarienne", "Pâtisserie", "Autre"];
const defaultCategories = ["Entrées", "Grillades", "Plats traditionnels", "Boissons", "Desserts"];

export default function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout, refresh, isAuthenticated, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");

  const [info, setInfo] = useState({ name: "", description: "", phone: "", address: "", cuisine: "" });
  const [plan, setPlan] = useState("Starter");
  const [color, setColor] = useState("#14b8a6");
  const [product, setProduct] = useState({ name: "", price: "", category: "Grillades" });

  // Pré-remplir depuis le restaurant créé à l'inscription
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    const r = user?.restaurant;
    if (r) {
      setInfo((prev) => ({
        name: r.name || prev.name,
        description: r.description || prev.description,
        phone: r.phone || prev.phone,
        address: r.address || prev.address,
        cuisine: prev.cuisine,
      }));
      if (r.color) setColor(r.color);
      if (r.slug) setSlug(r.slug);
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const doLogout = async () => {
    setLoggingOut(true);
    await handleLogout();
  };

  const next = async () => {
    if (step === 1) {
      if (!info.name?.trim() || !info.phone?.trim()) {
        toast("Renseignez au moins le nom et le téléphone du restaurant", "error");
        return;
      }
      // Sauvegarde immédiate des infos restaurant
      setSaving(true);
      try {
        const updated = await restaurantApi.updateSettings({
          name: info.name.trim(),
          phone: info.phone.trim(),
          address: info.address?.trim() || null,
          description: info.description?.trim()
            ? `${info.cuisine ? `[${info.cuisine}] ` : ""}${info.description.trim()}`
            : info.cuisine
              ? `Cuisine ${info.cuisine}`
              : null,
        });
        if (updated?.slug) setSlug(updated.slug);
        toast("Infos restaurant enregistrées");
        setStep(2);
      } catch (err) {
        toast(err.message || "Impossible d'enregistrer les infos", "error");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 2) {
      // L'abonnement trial est déjà créé à l'inscription — on continue
      setStep(3);
      return;
    }

    if (step === 3) {
      setSaving(true);
      try {
        await restaurantApi.updateSettings({ color });
        toast("Personnalisation enregistrée");
        setStep(4);
      } catch (err) {
        toast(err.message || "Impossible d'enregistrer la couleur", "error");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 4) {
      if (!product.name?.trim() || !product.price) {
        toast("Renseignez le nom et le prix du produit", "error");
        return;
      }
      const price = Number(product.price);
      if (Number.isNaN(price) || price < 0) {
        toast("Prix invalide", "error");
        return;
      }

      setSaving(true);
      try {
        // 1. Créer ou retrouver la catégorie
        let categoryId = null;
        const cats = await restaurantApi.categories();
        const list = Array.isArray(cats) ? cats : cats?.data || [];
        const existing = list.find(
          (c) => c.name?.toLowerCase() === product.category.toLowerCase()
        );
        if (existing) {
          categoryId = existing.id;
        } else {
          const created = await restaurantApi.createCategory({
            name: product.category,
            is_active: true,
            sort_order: list.length,
          });
          categoryId = created.id;
        }

        // 2. Créer le premier produit
        await restaurantApi.createProduct({
          name: product.name.trim(),
          price,
          category_id: categoryId,
          is_available: true,
          is_featured: true,
        });

        // 3. Publier la boutique (status active + ouverte)
        const published = await restaurantApi.updateSettings({
          status: "active",
          is_open: true,
        });
        if (published?.slug) setSlug(published.slug);

        // Rafraîchir la session utilisateur
        await refresh();

        toast("Votre restaurant est en ligne !");
        setStep(5);
      } catch (err) {
        console.error(err);
        toast(err.message || "Échec de la publication. Réessayez.", "error");
      } finally {
        setSaving(false);
      }
      return;
    }
  };

  const back = () => {
    if (step > 1 && step < 5) setStep(step - 1);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner label="Chargement…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="Configuration du restaurant" noindex />
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white">
              <UtensilsCrossed size={20} />
            </span>
            <span className="text-lg font-bold tracking-tight">RestoHub</span>
          </Link>
          <Button variant="ghost" onClick={() => setConfirmLogout(true)}>
            <LogOut size={16} /> Déconnexion
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between gap-2">
            {stepLabels.map((label, i) => {
              const n = i + 1;
              const Icon = stepIcons[i];
              const done = n < step;
              const current = n === step;
              return (
                <div key={label} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                      done
                        ? "border-primary-500 bg-primary-500 text-white"
                        : current
                          ? "border-primary-500 bg-white text-primary-600"
                          : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    {done ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <span
                    className={`hidden text-xs font-medium sm:block ${
                      current || done ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300"
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1 — Infos restaurant */}
        {step === 1 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-bold">Parlez-nous de votre restaurant</h1>
            <p className="mt-1 text-sm text-gray-500">
              Ces infos apparaîtront sur votre menu et carte en ligne.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Input
                label="Nom du restaurant *"
                placeholder="Le Saveur d'Or"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
              />
              <Input
                label="Téléphone *"
                placeholder="+225 07 00 00 00"
                value={info.phone}
                onChange={(e) => setInfo({ ...info, phone: e.target.value })}
              />
              <Input
                label="Adresse"
                placeholder="Cocody, Abidjan"
                value={info.address}
                onChange={(e) => setInfo({ ...info, address: e.target.value })}
                className="sm:col-span-2"
              />
              <Select
                label="Type de cuisine"
                value={info.cuisine}
                onChange={(e) => setInfo({ ...info, cuisine: e.target.value })}
              >
                <option value="">Choisir…</option>
                {cuisines.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <div className="sm:col-span-2">
                <Textarea
                  label="Description courte"
                  placeholder="Cuisine africaine moderne et grillades premium…"
                  rows={3}
                  value={info.description}
                  onChange={(e) => setInfo({ ...info, description: e.target.value })}
                />
              </div>
            </div>
          </section>
        )}

        {/* Step 2 — Abonnement (déjà trial) */}
        {step === 2 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-bold">Votre essai gratuit est activé</h1>
            <p className="mt-1 text-sm text-gray-500">
              14 jours d'essai sur le plan Starter. Vous pourrez changer de plan plus tard dans Facturation.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {plans.map((p) => {
                const selected = plan === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setPlan(p.name)}
                    className={`rounded-xl border-2 p-5 text-left transition ${
                      selected
                        ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{p.name}</span>
                      {selected && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-2xl font-extrabold text-gray-900">
                      {p.price === 0 ? "Gratuit" : fmt(p.price)}
                      {p.price > 0 && <span className="text-sm font-normal text-gray-500">/mois</span>}
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                      {p.features?.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check size={14} className="mt-0.5 shrink-0 text-primary-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-center text-xs text-gray-400">
              Aucun paiement requis pour l'instant — trial de 14 jours.
            </p>
          </section>
        )}

        {/* Step 3 — Personnalisation */}
        {step === 3 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-bold">Personnalisez votre restaurant</h1>
            <p className="mt-1 text-sm text-gray-500">
              Choisissez la couleur principale de votre marque.
            </p>
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-gray-700">Couleur principale</p>
              <div className="flex flex-wrap gap-3">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Couleur ${c}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                      color === c ? "ring-2 ring-gray-900 ring-offset-2" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={16} className="text-white" />}
                  </button>
                ))}
              </div>
              <div
                className="mt-6 rounded-xl p-6 text-white shadow-inner"
                style={{ backgroundColor: color }}
              >
                <p className="text-sm font-medium opacity-90">Aperçu</p>
                <p className="mt-1 text-2xl font-bold">{info.name || "Votre restaurant"}</p>
                <p className="mt-1 text-sm opacity-80">Commandez en ligne en quelques clics</p>
              </div>
            </div>
          </section>
        )}

        {/* Step 4 — Premier produit */}
        {step === 4 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-bold">Ajoutez votre premier produit</h1>
            <p className="mt-1 text-sm text-gray-500">
              Commencez votre menu. Vous pourrez en ajouter d'autres dans le dashboard.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Input
                label="Nom du produit *"
                placeholder="Poulet Braisé"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
              />
              <Input
                label="Prix (FCFA) *"
                type="number"
                min="0"
                placeholder="4500"
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: e.target.value })}
              />
              <Select
                label="Catégorie"
                value={product.category}
                onChange={(e) => setProduct({ ...product, category: e.target.value })}
              >
                {defaultCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                className="flex aspect-[4/1.6] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition hover:border-primary-400 hover:text-primary-600"
              >
                <ImagePlus size={22} />
                <span className="text-sm font-medium">Photo (optionnel — plus tard)</span>
              </button>
            </div>
          </section>
        )}

        {/* Step 5 — Succès */}
        {step === 5 && (
          <section className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-50 text-success-500">
              <Check size={40} strokeWidth={2.5} />
            </span>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight">C'est publié ! 🎉</h1>
            <p className="mt-3 max-w-md text-sm text-gray-600">
              Félicitations{info.name ? `, ${info.name}` : ""} ! Votre restaurant est maintenant en
              ligne et prêt à recevoir ses premières commandes.
            </p>
            {slug && (
              <p className="mt-2 text-sm text-primary-600">
                URL publique : <strong>/store/{slug}</strong>
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button className="px-6 py-3" onClick={() => navigate("/dashboard")}>
                <LayoutDashboard size={17} /> Voir mon dashboard
              </Button>
              <Button
                variant="secondary"
                className="px-6 py-3"
                onClick={() => navigate(slug ? `/store/${slug}` : "/store")}
              >
                <ShoppingCart size={17} /> Voir mon menu en ligne
              </Button>
            </div>
          </section>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="mt-8 flex items-center justify-between">
            <Button variant="secondary" onClick={back} disabled={step === 1 || saving}>
              <ArrowLeft size={16} /> Retour
            </Button>
            <p className="text-sm text-gray-400">Étape {step} sur 5</p>
            <Button onClick={next} disabled={saving}>
              {saving ? (
                <>Enregistrement…</>
              ) : (
                <>
                  {step === 4 ? "Publier mon restaurant" : "Continuer"} <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={confirmLogout}
        title="Se déconnecter"
        message="Voulez-vous vraiment vous déconnecter ?"
        confirmLabel="Se déconnecter"
        danger
        loading={loggingOut}
        onConfirm={doLogout}
        onClose={() => setConfirmLogout(false)}
      />
    </div>
  );
}
