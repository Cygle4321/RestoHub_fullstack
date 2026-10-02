/** Mapping statuts API (snake) ↔ UI (labels FR) */

export const ORDER_STATUS_UI = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  prete: "Prête",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

export const ORDER_STATUS_API = Object.fromEntries(
  Object.entries(ORDER_STATUS_UI).map(([k, v]) => [v, k])
);

export function orderStatusToUi(status) {
  if (!status) return status;
  return ORDER_STATUS_UI[status] || status;
}

export function orderStatusToApi(label) {
  if (!label) return label;
  return ORDER_STATUS_API[label] || label;
}

export const PAYMENT_STATUS_LABEL = {
  paid: "Payé",
  pending: "En attente",
  failed: "Échoué",
  refunded: "Remboursé",
};

export const PAYMENT_STATUS_VARIANT = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
};

export function paymentMethodLabel(method) {
  if (!method) return "—";
  const m = String(method).toLowerCase();
  if (m.includes("mobile") || m.includes("momo") || m.includes("fedapay")) return "MM";
  if (m.includes("cash") || m.includes("espèce") || m.includes("livraison")) return "Espèces";
  if (m.includes("card") || m.includes("carte")) return "Carte";
  return method;
}

export function mapOrder(o) {
  if (!o) return o;
  const pMethod = o.payment_method || o.payment;
  const pStatus = o.payment_status || "pending";

  const customerName = (typeof o.customer === "object" && o.customer?.name)
    ? o.customer.name
    : (o.customer_name || "Client");

  const customerPhone = (typeof o.customer === "object" && o.customer?.phone)
    ? o.customer.phone
    : (o.customer_phone || "—");

  const customerEmail = (typeof o.customer === "object" && o.customer?.email)
    ? o.customer.email
    : (o.customer_email || "—");

  return {
    ...o,
    number: o.number || o.id || "CMD-—",
    _id: o.id,
    status: orderStatusToUi(o.status) || "Nouvelle",
    mode: o.mode === "livraison" ? "Livraison" : o.mode === "retrait" ? "Retrait" : (o.mode || "Livraison"),
    customer: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
    },
    date: o.created_at
      ? new Date(o.created_at).toLocaleString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : (o.date || "—"),
    payment_method_label: paymentMethodLabel(pMethod),
    payment_status_label: PAYMENT_STATUS_LABEL[pStatus] || pStatus,
    payment_status_variant: PAYMENT_STATUS_VARIANT[pStatus] || "warning",
    payment:
      pMethod === "mobile_money" || pMethod === "fedapay"
        ? "MM"
        : pMethod === "card"
          ? "Carte"
          : pMethod === "cash"
            ? "Espèces"
            : (pMethod || "—"),
    address: o.delivery_address || o.address || "—",
    items: Array.isArray(o.items) ? o.items.map((it) => ({
      name: it?.name || "Article",
      qty: it?.quantity ?? it?.qty ?? 1,
      price: it?.unit_price ?? it?.price ?? 0,
      options: Array.isArray(it?.options) ? it.options : [],
      supplements: Array.isArray(it?.supplements) ? it.supplements : [],
    })) : [],
    history: Array.isArray(o.status_history || o.history) ? (o.status_history || o.history).map((h) => ({
      s: orderStatusToUi(h?.s || h?.status) || "Statut",
      t: h?.t || h?.time || "",
    })) : [],
    total: o.total ?? 0,
  };
}

export function mapProduct(p) {
  if (!p) return p;
  return {
    ...p,
    available: p.is_available ?? p.available,
    featured: p.is_featured ?? p.featured,
    category: p.category?.name || p.category,
  };
}

export function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("fr-FR") + " FCFA";
}
