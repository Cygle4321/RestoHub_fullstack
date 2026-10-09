import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, Eye, EyeOff, AlertCircle, Mail } from "lucide-react";
import { Button, useToast } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import SEO from "../../components/common/SEO";

/** Champ avec bordure rouge + message d'erreur intégré */
function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register } = useAuth();
  const [form, setForm] = useState({ restaurant: "", owner: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
    // Efface l'erreur dès que l'utilisateur commence à corriger
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.restaurant.trim()) e.restaurant = "Le nom du restaurant est requis";
    if (!form.owner.trim()) e.owner = "Le nom du propriétaire est requis";
    if (!form.email.trim()) e.email = "L'adresse email est requise";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Adresse email invalide";
    if (!form.password) e.password = "Le mot de passe est requis";
    else if (form.password.length < 6) e.password = "Minimum 6 caractères requis";
    if (!form.confirm) e.confirm = "Veuillez confirmer votre mot de passe";
    else if (form.password !== form.confirm) e.confirm = "Les mots de passe ne correspondent pas";
    if (!terms) e.terms = "Vous devez accepter les conditions d'utilisation";
    return e;
  };

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-2 ${
      errors[field]
        ? "border-red-400 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-200"
        : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-100"
    }`;

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast("Veuillez corriger les erreurs du formulaire", "error");
      return;
    }
    setErrors({});
    setLoading(true);
    register({
      name: form.owner,
      email: form.email,
      password: form.password,
      password_confirmation: form.confirm,
      restaurant_name: form.restaurant,
    })
      .then(() => {
        toast("Compte créé avec succès — un email de vérification vous a été envoyé");
        navigate("/onboarding");
      })
      .catch((err) => toast(err.message || "Inscription impossible", "error"))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <SEO title="Créer un compte restaurant" noindex />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white">
              <UtensilsCrossed size={22} />
            </span>
            <span className="text-xl font-bold tracking-tight text-gray-900">RestoHub</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Créez votre boutique</h1>
          <p className="mt-1 text-sm text-gray-500">Gratuit, sans engagement. En ligne en 5 minutes.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-4" noValidate>

            <Field label="Nom du restaurant *" error={errors.restaurant}>
              <input
                className={inputClass("restaurant")}
                placeholder="Le Saveur d'Or"
                value={form.restaurant}
                onChange={set("restaurant")}
              />
            </Field>

            <Field label="Nom du propriétaire *" error={errors.owner}>
              <input
                className={inputClass("owner")}
                placeholder="Mohamed Diallo"
                value={form.owner}
                onChange={set("owner")}
              />
            </Field>

            <Field label="Adresse email *" error={errors.email}>
              <div className="relative">
                <input
                  type="email"
                  className={inputClass("email") + " pr-10"}
                  placeholder="vous@restaurant.com"
                  value={form.email}
                  onChange={set("email")}
                />
                <Mail size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </Field>

            <Field label="Mot de passe *" error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={inputClass("password")}
                  placeholder="Au moins 6 caractères"
                  value={form.password}
                  onChange={set("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Confirmer le mot de passe *" error={errors.confirm}>
              <input
                type={showPassword ? "text" : "password"}
                className={inputClass("confirm")}
                placeholder="••••••••"
                value={form.confirm}
                onChange={set("confirm")}
              />
            </Field>

            <div>
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 transition ${
                  errors.terms ? "bg-red-50 ring-1 ring-red-300" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => {
                    setTerms(e.target.checked);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
                  }}
                  className={`mt-0.5 h-4 w-4 rounded focus:ring-primary-500 ${
                    errors.terms ? "border-red-400 text-red-600" : "border-gray-300 text-primary-600"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  J'accepte les <Link to="/terms" target="_blank" className="font-medium text-primary-600 underline hover:text-primary-700">conditions d'utilisation</Link> et la{" "}
                  <Link to="/privacy" target="_blank" className="font-medium text-primary-600 underline hover:text-primary-700">politique de confidentialité</Link>.
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle size={12} className="shrink-0" />
                  {errors.terms}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {loading ? "Création en cours…" : "Créer mon compte"}
            </Button>
          </form>

          <p className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
            Vous avez déjà un compte ?{" "}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
