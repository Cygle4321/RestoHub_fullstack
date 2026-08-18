import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function EmailVerified() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.email_verified_at) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goHome = () => {
    navigate(user?.role === "super_admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8] px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-50">
          <svg
            className="h-7 w-7 text-success-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-900">Email vérifié</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Votre adresse email a bien été confirmée. Vous pouvez maintenant profiter de votre compte RestoHub.
        </p>
        <button
          onClick={goHome}
          className="mt-6 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
        >
          Accéder à mon espace
        </button>
      </div>
    </div>
  );
}