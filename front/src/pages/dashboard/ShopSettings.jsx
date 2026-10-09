import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ImagePlus, Star, UtensilsCrossed, X } from "lucide-react";
import { Button, Card, CardHeader, Input, Textarea, useToast, Spinner } from "../../components/ui";
import { restaurantApi } from "../../api/restaurant";
import { useAuth } from "../../context/AuthContext";
import { compressImage, IMAGE_TYPES, MAX_IMAGE_SIZE } from "../../lib/image";

const DAYS = [
  { key: "lun", label: "Lundi" }, { key: "mar", label: "Mardi" }, { key: "mer", label: "Mercredi" },
  { key: "jeu", label: "Jeudi" }, { key: "ven", label: "Vendredi" }, { key: "sam", label: "Samedi" }, { key: "dim", label: "Dimanche" },
];
const SWATCHES = ["#14b8a6", "#e11d48", "#16a34a", "#2563eb", "#9333ea", "#f59e0b"];

export default function ShopSettings() {
  const toast = useToast();
  const { restaurant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [storeSlug, setStoreSlug] = useState(restaurant?.slug || "");
  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "#14b8a6",
    address: "",
    logo: "",
    cover: "",
    hours: { lun: "11:00 - 23:00", mar: "11:00 - 23:00", mer: "11:00 - 23:00", jeu: "11:00 - 23:00", ven: "11:00 - 23:00", sam: "11:00 - 23:00", dim: "11:00 - 23:00" },
    social: { facebook: "", instagram: "", whatsapp: "" },
  });
  const [processing, setProcessing] = useState(false);
  const logoInput = useRef(null);
  const coverInput = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await restaurantApi.settings();
        if (!cancelled && res) {
          const s = res.data || res;
          if (s.slug) setStoreSlug(s.slug);
          setForm({
            name: s.name || "",
            description: s.description || "",
            color: s.color || "#14b8a6",
            address: s.address || "",
            logo: s.logo || "",
            cover: s.cover || "",
            hours: s.hours || form.hours,
            social: s.social || form.social,
          });
        }
      } catch {
        // Silent error
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleImage = async (key, file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast("Format non supporté (PNG, JPG ou WebP)", "error");
    if (file.size > MAX_IMAGE_SIZE) return toast("Image trop lourde (max 4 Mo)", "error");
    setProcessing(true);
    try {
      const maxDim = key === "logo" ? 512 : 1280;
      const dataUrl = await compressImage(file, maxDim, 0.85);
      set(key, dataUrl);
      toast(key === "logo" ? "Logo ajouté" : "Couverture ajoutée", "success");
    } catch {
      toast("Impossible de traiter l'image", "error");
    } finally {
      setProcessing(false);
    }
  };

  const saveSettings = async () => {
    try {
      await restaurantApi.updateSettings(form);
      toast("Paramètres du restaurant enregistrés");
    } catch {
      toast("Erreur lors de l'enregistrement", "error");
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner label="Chargement des paramètres..." /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mon restaurant</h1>
        <Link
          to={storeSlug ? `/store/${storeSlug}` : "/store"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          Voir le menu en ligne <ExternalLink size={15} />
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Identité du restaurant" />
            <div className="space-y-5 p-5">
              <input
                ref={logoInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => { handleImage("logo", e.target.files[0]); e.target.value = ""; }}
              />
              <input
                ref={coverInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => { handleImage("cover", e.target.files[0]); e.target.value = ""; }}
              />
              <div className="flex items-center gap-5">
                <div className="relative">
                  <button
                    onClick={() => logoInput.current?.click()}
                    disabled={processing}
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-primary-400 hover:text-primary-500 disabled:opacity-60"
                    title="Changer le logo"
                  >
                    {form.logo ? <img src={form.logo} alt="Logo" className="h-full w-full object-cover" /> : <ImagePlus size={24} />}
                  </button>
                  {form.logo && (
                    <button
                      onClick={() => set("logo", "")}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white shadow hover:bg-gray-700"
                      title="Supprimer le logo"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Logo du restaurant</p>
                  <p className="text-xs text-gray-500">Carré, PNG transparent recommandé</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => coverInput.current?.click()}
                  disabled={processing}
                  className="flex h-28 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-primary-400 hover:text-primary-500 disabled:opacity-60"
                  style={form.cover ? { backgroundImage: `url(${form.cover})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                >
                  {!form.cover && <><ImagePlus size={22} /> Image de couverture (bannière)</>}
                </button>
                {form.cover && (
                  <button
                    onClick={() => set("cover", "")}
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/80 text-white shadow hover:bg-gray-700"
                    title="Supprimer la couverture"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <Input label="Nom du restaurant" value={form.name} onChange={(e) => set("name", e.target.value)} />
              <Textarea label="Description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Couleur du thème</p>
                <div className="flex gap-3">
                  {SWATCHES.map((c) => (
                    <button key={c} onClick={() => set("color", c)} className={`h-9 w-9 rounded-full ring-2 ring-offset-2 transition ${form.color === c ? "ring-gray-900" : "ring-transparent"}`} style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Horaires d'ouverture" subtitle="Heure d'ouverture et de fermeture par jour" />
            <div className="space-y-3 p-5">
              {DAYS.map((d) => (
                <div key={d.key} className="grid grid-cols-[100px_1fr] items-center gap-4 sm:grid-cols-[120px_1fr_1fr]">
                  <span className="text-sm font-medium text-gray-700">{d.label}</span>
                  <Input
                    type="text"
                    value={form.hours[d.key]}
                    onChange={(e) => set("hours", { ...form.hours, [d.key]: e.target.value })}
                    placeholder="11:00 - 23:00"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Coordonnées & réseaux sociaux" />
            <div className="space-y-5 p-5">
              <Input label="Adresse" value={form.address} onChange={(e) => set("address", e.target.value)} />
              <div className="grid gap-5 sm:grid-cols-3">
                <Input label="Facebook" value={form.social.facebook} onChange={(e) => set("social", { ...form.social, facebook: e.target.value })} />
                <Input label="Instagram" value={form.social.instagram} onChange={(e) => set("social", { ...form.social, instagram: e.target.value })} />
                <Input label="WhatsApp" value={form.social.whatsapp} onChange={(e) => set("social", { ...form.social, whatsapp: e.target.value })} />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveSettings}>Enregistrer les modifications</Button>
          </div>
        </div>

        <div className="xl:col-span-1">
          <Card className="sticky top-6">
            <CardHeader title="Aperçu" subtitle="Rendu en temps réel de votre restaurant" />
            <div className="p-5">
              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <div className="h-16" style={form.cover ? { backgroundImage: `url(${form.cover})`, backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: form.color }} />
                <div className="bg-white p-4">
                  <div className="-mt-8 mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-4 border-white shadow" style={form.logo ? undefined : { backgroundColor: form.color }}>
                    {form.logo ? <img src={form.logo} alt="Logo" className="h-full w-full object-cover" /> : <UtensilsCrossed size={20} className="text-white" />}
                  </div>
                  <p className="font-bold text-gray-900">{form.name || "Nom du restaurant"}</p>
                  <p className="mt-1 line-clamp-3 text-xs text-gray-500">{form.description || "Description de votre restaurant…"}</p>
                  <p className="mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: form.color }}>
                    Ouvert · {form.hours.lun}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="rounded-lg bg-gray-100 p-2">
                        <div className="mb-1.5 flex h-10 items-center justify-center rounded bg-gray-200 text-gray-400"><UtensilsCrossed size={14} /></div>
                        <div className="h-1.5 rounded bg-gray-200" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    <Star size={12} className="fill-amber-400 text-amber-400" /> 4.8 · 128 avis
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
