import { FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f4f5] p-6">
      <SEO title="Page non trouvée (404)" noindex />
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-zinc-400 shadow-sm">
          <FileQuestion size={36} strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl font-black tracking-tight text-zinc-900">404</h1>
        <p className="mt-2 text-base font-semibold text-zinc-700">Page introuvable</p>
        <p className="mt-1 text-sm text-zinc-500">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            Retour à l'accueil
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Console admin
          </Link>
        </div>
      </div>
    </div>
  );
}