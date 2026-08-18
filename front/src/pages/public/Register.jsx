import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, Eye, EyeOff } from "lucide-react";
import { Button, Input, useToast } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register } = useAuth();
  const [form, setForm] = useState({ restaurant: "", owner: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.restaurant || !form.owner || !form.email || !form.password) {
      toast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }
    if (form.password.length < 6) {
      toast("Le mot de passe doit contenir au moins 6 caractères", "error");
      return;
    }
    if (form.password !== form.confirm) {
      toast("Les mots de passe ne correspondent pas", "error");
      return;
    }
    if (!terms) {
      toast("Veuillez accepter les conditions d'utilisation", "error");
      return;
    }
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
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white">
              <UtensilsCrossed size={22} />
            </span>
            <span className="text-xl font-bold tracking-tight text-gray-900">RestoHub</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Créez votre boutique</h1>
          <p className="mt-1 text-sm text-gray-500"> Gratuit, sans engagement. En ligne en 5 minutes.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-4">
            <Input label="Nom du restaurant" placeholder="Le Saveur d'Or" value={form.restaurant} onChange={set("restaurant")} />
            <Input label="Nom du propriétaire" placeholder="Mohamed Diallo" value={form.owner} onChange={set("owner")} />
            <Input label="Adresse email" type="email" placeholder="vous@restaurant.com" value={form.email} onChange={set("email")} />

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-[38px] rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <Input
                label="Mot de passe"
                type={showPassword ? "text" : "password"}
                placeholder="Au moins 6 caractères"
                value={form.password}
                onChange={set("password")}
              />
            </div>
            <Input
              label="Confirmer le mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.confirm}
              onChange={set("confirm")}
            />

            <label className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                J'accepte les <span className="font-medium text-primary-600">conditions d'utilisation</span> et la{" "}
                <span className="font-medium text-primary-600">politique de confidentialité</span>.
              </span>
            </label>

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
