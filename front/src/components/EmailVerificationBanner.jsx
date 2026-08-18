import { useState } from "react";
import { MailWarning } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function EmailVerificationBanner() {
  const { isEmailVerified, resendVerification } = useAuth();
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  if (isEmailVerified) return null;

  const resend = async () => {
    setSending(true);
    setStatus(null);
    try {
      await resendVerification();
      setStatus({ ok: true, text: "Email envoyé. Vérifiez votre boîte de réception." });
    } catch (e) {
      setStatus({ ok: false, text: e.message || "Impossible d'envoyer l'email. Réessayez plus tard." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto mb-6 flex max-w-6xl flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <MailWarning size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Vérifiez votre adresse email</p>
          <p className="text-xs text-amber-700">
            Un lien de confirmation vous a été envoyé. Cliquez dessus pour activer pleinement votre compte.
          </p>
          {status && (
            <p className={`mt-1 text-xs font-medium ${status.ok ? "text-success-700" : "text-danger-700"}`}>
              {status.text}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={resend}
        disabled={sending}
        className="shrink-0 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
      >
        {sending ? "Envoi…" : "Renvoyer l'email"}
      </button>
    </div>
  );
}