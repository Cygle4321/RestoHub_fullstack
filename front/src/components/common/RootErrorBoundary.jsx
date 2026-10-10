import { useEffect } from "react";
import { useRouteError, Link } from "react-router-dom";
import { RefreshCw, Home, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "../ui";

export default function RootErrorBoundary() {
  const error = useRouteError();

  const errorMessage =
    error?.message || (typeof error === "string" ? error : "") || JSON.stringify(error || "");

  // Détection des erreurs de modules dynamiques obsolètes (suite à un nouveau déploiement)
  const isChunkError =
    errorMessage.includes("Failed to fetch dynamically imported module") ||
    errorMessage.includes("Importing a module script failed") ||
    errorMessage.includes("error loading dynamically imported module") ||
    error?.name === "ChunkLoadError";

  // Tentative de rechargement automatique immédiat si nouvelle version déployée
  useEffect(() => {
    if (isChunkError) {
      const key = "restohub_auto_reload_" + window.location.pathname;
      const reloaded = sessionStorage.getItem(key);
      if (!reloaded) {
        sessionStorage.setItem(key, "true");
        window.location.reload();
      }
    }
  }, [isChunkError]);

  const handleReload = () => {
    // Nettoie les caches de session et recharge depuis le serveur
    try {
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-xs">
          {isChunkError ? <Sparkles size={28} /> : <AlertTriangle size={28} />}
        </div>

        <h1 className="mt-5 text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">
          {isChunkError ? "Nouvelle version disponible" : "Une erreur est survenue"}
        </h1>

        <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
          {isChunkError
            ? "Une mise à jour récente de l'application a été déployée sur le serveur. Veuillez actualiser la page pour charger les nouvelles fonctionnalités."
            : "L'application a rencontré un problème inattendu lors de l'affichage de cette page."}
        </p>

        {process.env.NODE_ENV === "development" && !isChunkError && (
          <div className="mt-4 max-h-32 overflow-auto rounded-lg bg-zinc-100 p-2.5 text-left font-mono text-[11px] text-zinc-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={handleReload} className="w-full sm:w-auto py-2.5 font-bold shadow-md">
            <RefreshCw size={15} />
            <span>Actualiser la page</span>
          </Button>

          <Link to="/" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto py-2.5">
              <Home size={15} />
              <span>Accueil</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
