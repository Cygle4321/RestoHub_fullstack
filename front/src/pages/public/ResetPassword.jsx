import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UtensilsCrossed, ShieldCheck, ArrowLeft, Loader2, MailQuestion } from "lucide-react";
import { Button, Input, useToast } from "../../components/ui";
import { apiClient } from "../../lib/apiClient";
import SEO from "../../components/common/SEO";

export default function ResetPassword() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirmation) return toast("Les mots de passe ne correspondent pas", "error");
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        email,
        token,
        password,
        password_confirmation: confirmation,
      });
      toast("Mot de passe réinitialisé. Connectez-vous.", "success");
      navigate("/login");
    } catch (err) {
      toast(err?.message || "Erreur lors de la réinitialisation", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <SEO title="Réinitialiser le mot de passe" noindex />
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white">
                <UtensilsCrossed size={22} />
              </span>
              <span className="text-xl font-bold tracking-tight text-gray-900">RestoHub</span>
            </Link>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <MailQuestion size={28} />
            </span>
            <h1 className="mt-5 text-xl font-bold text-gray-900">Lien invalide</h1>
            <p className="mt-2 text-sm text-gray-500">
              Ce lien de réinitialisation est incomplet ou expiré. Faites une nouvelle demande de réinitialisation.
            </p>
            <Link to="/forgot-password" className="mt-6 block">
              <Button variant="secondary" className="w-full py-3">
                <ArrowLeft size={16} /> Mot de passe oublié
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <SEO title="Nouveau mot de passe" noindex />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white">
              <UtensilsCrossed size={22} />
            </span>
            <span className="text-xl font-bold tracking-tight text-gray-900">RestoHub</span>
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <ShieldCheck size={18} />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Nouveau mot de passe</h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">Choisissez un nouveau mot de passe pour votre compte.</p>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <Input label="Compte" type="email" value={email} readOnly className="bg-gray-50 text-gray-500" />
            <Input label="Nouveau mot de passe" type="password" placeholder="8 caractères minimum" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Input label="Confirmer le mot de passe" type="password" placeholder="Re-saisissez le mot de passe" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
            </Button>
          </form>
          <p className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
            <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700">
              <ArrowLeft size={14} /> Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}