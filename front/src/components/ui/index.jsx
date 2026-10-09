import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, X, Info, Search } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Badge                                                                      */
/* -------------------------------------------------------------------------- */
const badgeStyles = {
  success: "bg-success-50 text-success-700 ring-success-500/15",
  danger: "bg-danger-50 text-danger-700 ring-danger-500/15",
  warning: "bg-amber-50 text-amber-700 ring-amber-500/15",
  info: "bg-sky-50 text-sky-700 ring-sky-500/15",
  neutral: "bg-zinc-100 text-zinc-600 ring-zinc-500/10",
  primary: "bg-primary-50 text-primary-700 ring-primary-500/15",
};

export function Badge({ variant = "neutral", children, dot = false, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset ${badgeStyles[variant]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />}
      {children}
    </span>
  );
}

export function statusVariant(status) {
  const s = status?.toLowerCase();
  if (["livrée", "actif", "réussi", "disponible", "ouvert"].some((k) => s?.includes(k))) return "success";
  if (["annulée", "suspendu", "inactif", "échoué", "remboursé"].some((k) => s?.includes(k))) return "danger";
  if (["nouvelle"].includes(s)) return "primary";
  if (["confirmée", "prête", "en course"].some((k) => s?.includes(k))) return "info";
  if (["en préparation", "en livraison", "attente"].some((k) => s?.includes(k))) return "warning";
  return "neutral";
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */
export function Card({ children, className = "", hover = false }) {
  return (
    <div
      className={`min-w-0 max-w-full rounded-2xl border border-zinc-200/80 bg-white shadow-card ${
        hover ? "transition-shadow duration-200 hover:shadow-elevated" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 px-4 sm:px-5 py-3.5 sm:py-4 ${className}`}>
      <div className="min-w-0">
        <h3 className="text-[13px] font-semibold tracking-tight text-zinc-900 truncate">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500 truncate">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 max-w-full overflow-x-auto scrollbar-none">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */
const btnVariants = {
  primary:
    "bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-700 focus-visible:outline-primary-600",
  secondary:
    "bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 hover:ring-zinc-300 active:bg-zinc-100",
  success: "bg-success-600 text-white shadow-sm hover:bg-success-700",
  danger: "bg-danger-600 text-white shadow-sm hover:bg-danger-700",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  soft: "bg-primary-50 text-primary-700 hover:bg-primary-100",
};

const btnSizes = {
  sm: "rounded-lg px-3 py-1.5 text-xs font-semibold",
  md: "rounded-xl px-4 py-2.5 text-sm font-semibold",
  lg: "rounded-xl px-5 py-3 text-sm font-semibold",
};

export function Button({ variant = "primary", size = "md", className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Inputs                                                                     */
/* -------------------------------------------------------------------------- */
const fieldBase =
  "block w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-xs transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20";

export function Input({ label, className = "", hint, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[13px] font-medium text-zinc-700">{label}</span>}
      <input className={`${fieldBase} ${className}`} {...props} />
      {hint && <span className="mt-1.5 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[13px] font-medium text-zinc-700">{label}</span>}
      <select className={`${fieldBase} ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[13px] font-medium text-zinc-700">{label}</span>}
      <textarea className={`${fieldBase} ${className}`} {...props} />
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-primary-500" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
      {label && <span className="text-sm text-zinc-700">{label}</span>}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */
export function Table({ headers, children, empty }) {
  if (empty) return <EmptyState title="Aucune donnée" description="Aucun résultat à afficher pour le moment." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100">
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }) {
  return <td className={`whitespace-nowrap px-5 py-3.5 text-zinc-600 ${className}`}>{children}</td>;
}

/* -------------------------------------------------------------------------- */
/* Stat card                                                                  */
/* -------------------------------------------------------------------------- */
export function StatCard({ label, value, icon: Icon, trend, trendUp = true, accent = "primary" }) {
  const accents = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-50 text-success-600",
    danger: "bg-danger-50 text-danger-600",
    info: "bg-sky-50 text-sky-600",
    neutral: "bg-zinc-100 text-zinc-600",
  };
  return (
    <Card className="p-5" hover>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-zinc-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
          {trend && (
            <p className={`mt-1.5 text-xs font-medium ${trendUp ? "text-success-600" : "text-danger-600"}`}>
              <span className="inline-flex items-center gap-0.5">
                {trendUp ? "↑" : "↓"} {trend}
              </span>
              <span className="ml-1 font-normal text-zinc-400">vs période préc.</span>
            </p>
          )}
        </div>
        {Icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accents[accent]}`}>
            <Icon size={18} strokeWidth={1.75} />
          </span>
        )}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty / Loading                                                            */
/* -------------------------------------------------------------------------- */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
          <Icon size={24} strokeWidth={1.5} />
        </span>
      )}
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Chargement…" }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-primary-600" />
      <p className="mt-3 text-sm text-zinc-500">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */
export function Modal({ open, onClose, title, children, footer, size = "md" }) {
  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative flex max-h-[92vh] w-full ${sizes[size]} flex-col overflow-hidden rounded-2xl bg-white shadow-xl`}>
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 sm:px-5 py-3.5 sm:py-4">
          <h3 className="truncate pr-2 text-sm font-semibold text-zinc-900">{title}</h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-5 py-4">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 sm:gap-3 border-t border-zinc-100 bg-zinc-50/50 px-4 sm:px-5 py-3 sm:py-3.5">{footer}</div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Toast                                                                      */
/* -------------------------------------------------------------------------- */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-4 right-4 z-[100] flex flex-col gap-2 sm:left-auto sm:w-[340px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-float"
          >
            {t.type === "success" && (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success-500" strokeWidth={1.75} />
            )}
            {t.type === "error" && (
              <XCircle size={18} className="mt-0.5 shrink-0 text-danger-500" strokeWidth={1.75} />
            )}
            {t.type === "info" && (
              <Info size={18} className="mt-0.5 shrink-0 text-sky-500" strokeWidth={1.75} />
            )}
            <p className="text-sm leading-snug text-zinc-800">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) || (() => {});
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */
export function Avatar({ name, src, className = "", size = "md" }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-sm",
  };
  if (src) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        className={`inline-flex shrink-0 items-center justify-center rounded-full object-cover ${sizes[size]} ${className}`}
      />
    );
  }
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 font-semibold text-white ${sizes[size]} ${className}`}
    >
      {initials}
    </span>
  );
}

export function SearchInput({ value, onChange, placeholder = "Rechercher…", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={1.75} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-xs transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
      />
    </div>
  );
}

export function Tabs({ tabs, active, onChange, className = "" }) {
  return (
    <div className={`flex max-w-full overflow-x-auto scrollbar-none py-0.5 ${className}`}>
      <div className="inline-flex shrink-0 gap-0.5 rounded-xl bg-zinc-100/80 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              active === t
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 break-words">{title}</h1>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
