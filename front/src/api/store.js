import { apiClient } from "../lib/apiClient";
import { mapOrder, mapProduct } from "../lib/mappers";

export const storeApi = {
  /** Catalogue public d'un restaurant par slug */
  get: async (slug) => {
    const data = await apiClient.get(`/store/${slug}`, { auth: false });
    return {
      ...data,
      products: (data.products || []).map(mapProduct),
    };
  },

  product: async (slug, productSlug) =>
    mapProduct(await apiClient.get(`/store/${slug}/products/${productSlug}`, { auth: false })),

  checkout: async (slug, payload) => {
    const data = await apiClient.post(
      `/store/${slug}/checkout`,
      {
        customer_name: payload.customer_name || payload.name,
        customer_phone: payload.customer_phone || payload.phone,
        customer_email: payload.customer_email || payload.email,
        mode: payload.mode === "Livraison" || payload.mode === "livraison" ? "livraison" : "retrait",
        delivery_address: payload.delivery_address || payload.address,
        delivery_zone_id: payload.delivery_zone_id || payload.zoneId,
        payment_method: mapPaymentMethod(payload.payment_method || payload.payment),
        promo_code: payload.promo_code || payload.promoCode,
        notes: payload.notes,
        items: (payload.items || []).map((it) => ({
          product_id: it.product_id || it.id,
          quantity: it.quantity || it.qty || 1,
          options: it.options,
          supplements: it.supplements,
        })),
      },
      { auth: false }
    );
    return {
      ...data,
      order: data.order ? mapOrder(data.order) : null,
    };
  },

  /** Vérifie un code promo pour un panier (sous-total + mode) */
  verifyPromo: async (slug, { code, subtotal, mode }) => {
    return apiClient.post(
      `/store/${slug}/promo/verify`,
      { code, subtotal, mode: mode === "Retrait" ? "retrait" : "livraison" },
      { auth: false }
    );
  },

  track: async (slug, number, phone) => {
    const q = new URLSearchParams({ number, phone }).toString();
    return mapOrder(await apiClient.get(`/store/${slug}/track?${q}`, { auth: false }));
  },

  /** Avis client après livraison (vérifié par numéro + téléphone) */
  addReview: async (slug, { number, phone, rating, comment }) => {
    return apiClient.post(
      `/store/${slug}/reviews`,
      { number, phone, rating, comment },
      { auth: false }
    );
  },

  /** Récupère la commande associée à une transaction FedaPay (retour callback) */
  paymentStatus: async (slug, transactionId) => {
    const data = await apiClient.get(`/store/${slug}/payment/${transactionId}`, { auth: false });
    return {
      ...data,
      order: data.order ? mapOrder(data.order) : null,
    };
  },
};

function mapPaymentMethod(p) {
  if (!p) return "cash";
  const s = String(p).toLowerCase();
  if (s.includes("mobile") || s.includes("money") || s.includes("orange") || s.includes("mtn"))
    return "mobile_money";
  if (s.includes("carte") || s.includes("card")) return "card";
  if (s.includes("feda")) return "fedapay";
  if (s.includes("livraison") || s.includes("cash") || s.includes("espèces")) return "cash";
  return "mobile_money";
}

/** Slug boutique démo (seed Laravel) */
export const DEFAULT_STORE_SLUG =
  import.meta.env.VITE_STORE_SLUG || "le-saveur-dor";
