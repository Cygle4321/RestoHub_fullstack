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

export function mapOrder(o) {
  if (!o) return o;
  return {
    ...o,
    number: o.number || o.id,
    _id: o.id,
    status: orderStatusToUi(o.status),
    mode: o.mode === "livraison" ? "Livraison" : o.mode === "retrait" ? "Retrait" : o.mode,
    customer: o.customer || {
      name: o.customer_name,
      phone: o.customer_phone,
      email: o.customer_email,
    },
    date: o.created_at
      ? new Date(o.created_at).toLocaleString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : o.date,
    payment:
      o.payment_method === "mobile_money"
        ? "Mobile Money"
        : o.payment_method === "card"
          ? "Carte bancaire"
          : o.payment_method === "cash"
            ? "Paiement à la livraison"
            : o.payment || o.payment_method,
    address: o.delivery_address || o.address || "—",
    items: (o.items || []).map((it) => ({
      name: it.name,
      qty: it.quantity ?? it.qty,
      price: it.unit_price ?? it.price,
    })),
    history: (o.status_history || o.history || []).map((h) => ({
      s: orderStatusToUi(h.s || h.status),
      t: h.t || h.time,
    })),
    total: o.total,
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
