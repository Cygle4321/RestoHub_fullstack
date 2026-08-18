import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button, Input, useToast } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, verifyTwoFactor } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState(null);
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  const redirect = (data) => {
    const role = data.user?.role;
    const from = location.state?.from;
    if (from) {
      navigate(from, { replace: true });
    } else if (role === "super_admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast("Veuillez renseigner votre email et votre mot de passe", "error");
      return;
    }
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.two_factor_required) {
        setTwoFactorEmail(data.email || email);
        setCode("");
        toast("Code de vérification requis", "info");
        return;
      }
      toast("Connexion réussie");
      redirect(data);
    } catch (err) {
      toast(err.message || "Échec de la connexion", "error");
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      toast("Entrez le code à 6 chiffres", "error");
      return;
    }
    setCodeLoading(true);
    try {
      const data = await verifyTwoFactor(twoFactorEmail, code.trim());
      toast("Connexion réussie");
      redirect(data);
    } catch (err) {
      toast(err.message || "Code invalide", "error");
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white">
              <UtensilsCrossed size={22} />
            </span>
            <span className="text-xl font-bold tracking-tight text-zinc-900">RestoHub</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
            {twoFactorEmail ? "Vérification en deux étapes" : "Bon retour !"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {twoFactorEmail
              ? `Entrez le code à 6 chiffres envoyé à ${twoFactorEmail}`
              : "Connectez-vous pour gérer votre boutique."}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          {!twoFactorEmail ? (
            <form onSubmit={submit} className="space-y-5">
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute right-3.5 top-[42px] text-zinc-400" />
                <Input
                  label="Adresse email"
                  type="email"
                  placeholder="vous@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-[42px] text-zinc-400 opacity-0" />
                <Input
                  label="Mot de passe"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  Mot de passe oublié ?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </form>
          ) : (
            <form onSubmit={submitCode} className="space-y-5">
              <div className="relative">
                <ShieldCheck size={16} className="pointer-events-none absolute right-3.5 top-[42px] text-zinc-400" />
                <Input
                  label="Code de vérification"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>
              <Button type="submit" className="w-full" disabled={codeLoading}>
                {codeLoading ? "Vérification…" : "Vérifier"}
              </Button>
              <button
                type="button"
                onClick={() => setTwoFactorEmail(null)}
                className="mx-auto flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-primary-600"
              >
                <ArrowLeft size={14} /> Retour à la connexion
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-zinc-500">
            Pas encore de compte ?{" "}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Créer un compte
            </Link>
          </p>
          <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-center text-[11px] text-zinc-400">
            Démo : owner@lesaveurdor.com / password · admin@restohub.com / password
          </p>
        </div>
      </div>
    </div>
  );
}