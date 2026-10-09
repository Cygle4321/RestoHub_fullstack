import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button, Card, CardHeader, Input, Select, Spinner, Textarea, Toggle, useToast } from "../../components/ui";
import { restaurantApi } from "../../api/restaurant";
import { compressImage, IMAGE_TYPES, MAX_IMAGE_SIZE } from "../../lib/image";

const toOptions = (list) =>
  (list || []).map((o) => ({ name: o.name, choices: (o.choices || []).join(", ") }));

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const editing = !!id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const imageInput = useRef(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image: "",
    available: true,
    featured: false,
  });
  const [options, setOptions] = useState([{ name: "", choices: "" }]);
  const [supplements, setSupplements] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, product] = await Promise.all([
          restaurantApi.categories(),
          id ? restaurantApi.product(id) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setCategories(Array.isArray(cats) ? cats : cats.data || []);
        if (product) {
          setForm({
            name: product.name || "",
            description: product.description || "",
            price: product.price != null ? String(product.price) : "",
            category_id: product.category_id || "",
            image: product.image || "",
            available: product.available ?? true,
            featured: product.featured ?? false,
          });
          setOptions(toOptions(product.options));
          setSupplements((product.supplements || []).map((s) => ({ name: s.name, price: String(s.price) })));
        }
      } catch (e) {
        if (!cancelled) toast(e?.message || "Erreur de chargement", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImage = async (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast("Format non supporté (PNG, JPG ou WebP)", "error");
    if (file.size > MAX_IMAGE_SIZE) return toast("Image trop lourde (max 4 Mo)", "error");
    setImageProcessing(true);
    try {
      const dataUrl = await compressImage(file, 640, 0.85);
      set("image", dataUrl);
      toast("Photo ajoutée", "success");
    } catch {
      toast("Impossible de traiter l'image", "error");
    } finally {
      setImageProcessing(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Le nom est requis";
    if (!form.price || Number(form.price) <= 0) errs.price = "Prix invalide";
    if (!form.category_id) errs.category = "Catégorie requise";
    setErrors(errs);
    if (Object.keys(errs).length) return toast("Veuillez corriger les erreurs du formulaire", "error");

    const payload = {
      name: form.name.trim(),
      description: form.description,
      price: Number(form.price),
      category_id: form.category_id,
      image: form.image || null,
      is_available: form.available,
      is_featured: form.featured,
      options: options
        .filter((o) => o.name.trim())
        .map((o) => ({ name: o.name.trim(), choices: o.choices.split(",").map((c) => c.trim()).filter(Boolean) })),
      supplements: supplements
        .filter((s) => s.name.trim())
        .map((s) => ({ name: s.name.trim(), price: Number(s.price) || 0 })),
    };

    setSaving(true);
    try {
      if (editing) {
        await restaurantApi.updateProduct(id, payload);
        toast(`Produit « ${form.name} » mis à jour`);
      } else {
        await restaurantApi.createProduct(payload);
        toast(`Produit « ${form.name} » créé`);
      }
      navigate("/dashboard/products");
    } catch (e) {
      toast(e?.message || "Erreur lors de l'enregistrement", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate("/dashboard/products")} className="inline-flex items-center gap-1.5 font-medium text-gray-500 hover:text-primary-600">
          <ArrowLeft size={16} /> Produits
        </button>
        <span>/</span>
        <span className="font-semibold text-gray-900">{editing ? "Modifier" : "Nouveau"}</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{editing ? "Modifier produit" : "Nouveau produit"}</h1>

      {loading ? (
        <Card><Spinner label="Chargement…" /></Card>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader title="Informations générales" />
            <div className="space-y-5 p-5">
              <input
                ref={imageInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => { handleImage(e.target.files[0]); e.target.value = ""; }}
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => imageInput.current?.click()}
                  disabled={imageProcessing}
                  className="flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-primary-400 hover:text-primary-500 disabled:opacity-60"
                  style={form.image ? { backgroundImage: `url(${form.image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                >
                  {!form.image && (
                    <>
                      <ImagePlus size={30} />
                      <span className="text-sm font-medium">{imageProcessing ? "Traitement de l'image…" : "Cliquez pour ajouter une photo"}</span>
                      <span className="text-xs">PNG ou JPG, 4 Mo max</span>
                    </>
                  )}
                </button>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => set("image", "")}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900/80 text-white shadow hover:bg-gray-700"
                    title="Retirer la photo"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <Input label="Nom du produit *" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex : Poulet Braisé" />
              {errors.name && <p className="-mt-3 text-xs text-danger-600">{errors.name}</p>}
              <Textarea label="Description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Décrivez le plat…" />
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Input label="Prix (FCFA) *" type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="4500" />
                  {errors.price && <p className="mt-1 text-xs text-danger-600">{errors.price}</p>}
                </div>
                <div>
                  <Select label="Catégorie *" value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
                    <option value="">Sélectionner…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  {errors.category && <p className="mt-1 text-xs text-danger-600">{errors.category}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-10 border-t border-gray-100 pt-4">
                <Toggle checked={form.available} onChange={(v) => set("available", v)} label="Disponible à la vente" />
                <Toggle checked={form.featured} onChange={(v) => set("featured", v)} label="Mettre en vedette" />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Groupes d'options"
              subtitle="Ex : Taille, Cuisson, Accompagnement…"
              action={<Button type="button" variant="secondary" onClick={() => setOptions((o) => [...o, { name: "", choices: "" }])}><Plus size={15} /> Ajouter</Button>}
            />
            <div className="space-y-4 p-5">
              {options.map((opt, i) => (
                <div key={i} className="grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                  <Input label="Nom" value={opt.name} onChange={(e) => setOptions((o) => o.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Taille" />
                  <Input label="Choix (séparés par des virgules)" value={opt.choices} onChange={(e) => setOptions((o) => o.map((x, j) => (j === i ? { ...x, choices: e.target.value } : x)))} placeholder="33cl, 50cl" />
                  <div className="flex justify-end sm:block">
                    <Button type="button" variant="ghost" className="!px-2 !text-danger-500" onClick={() => setOptions((o) => o.filter((_, j) => j !== i))} title="Supprimer"><Trash2 size={16} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Suppléments"
              subtitle="Options payantes ajoutables par le client"
              action={<Button type="button" variant="secondary" onClick={() => setSupplements((s) => [...s, { name: "", price: "" }])}><Plus size={15} /> Ajouter</Button>}
            />
            <div className="space-y-4 p-5">
              {supplements.length === 0 && <p className="text-sm text-gray-500">Aucun supplément. Cliquez sur « Ajouter » pour en créer.</p>}
              {supplements.map((sup, i) => (
                <div key={i} className="grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
                  <Input label="Nom" value={sup.name} onChange={(e) => setSupplements((s) => s.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Sauce piment" />
                  <Input label="Prix (FCFA)" type="number" min="0" value={sup.price} onChange={(e) => setSupplements((s) => s.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} placeholder="250" />
                  <div className="flex justify-end sm:block">
                    <Button type="button" variant="ghost" className="!px-2 !text-danger-500" onClick={() => setSupplements((s) => s.filter((_, j) => j !== i))} title="Supprimer"><Trash2 size={16} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate("/dashboard/products")}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}