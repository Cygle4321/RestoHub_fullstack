import { useState } from "react";
import { Link } from "react-router-dom";
import { UtensilsCrossed, MailCheck, ArrowLeft } from "lucide-react";
import { Button, Input, useToast } from "../../components/ui";
import { apiClient } from "../../lib/apiClient";
import SEO from "../../components/common/SEO";

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast(err?.message || "Erreur lors de la demande", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <SEO title="Mot de passe oublié" noindex />
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
          {sent ? (
            <div className="flex flex-col items-center py-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-500">
                <MailCheck size={28} />
              </span>
              <h1 className="mt-5 text-xl font-bold text-gray-900">Un lien de réinitialisation a été envoyé</h1>
              <p className="mt-2 text-sm text-gray-500">
                Vérifiez votre boîte mail <span className="font-medium text-gray-700">{email}</span> et suivez les
                instructions pour choisir un nouveau mot de passe.
              </p>
              <p className="mt-4 text-xs text-gray-400">Pas reçu d'email ? Vérifiez vos spams ou réessayez.</p>
              <Link to="/login" className="mt-6">
                <Button variant="secondary" className="w-full py-3">
                  <ArrowLeft size={16} /> Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Mot de passe oublié</h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-5">
                <Input
                  label="Adresse email"
                  type="email"
                  placeholder="vous@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" className="w-full py-3" disabled={loading}>
                  {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {loading ? "Envoi en cours…" : "Envoyer le lien"}
                </Button>
              </form>
              <p className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
