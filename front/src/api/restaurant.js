import { apiClient } from "../lib/apiClient";
import { mapOrder, mapProduct, orderStatusToApi } from "../lib/mappers";

export const restaurantApi = {
  dashboard: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/restaurant/dashboard?${q}`);
  },

  // Orders
  orders: async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "" && v !== "Toutes" && v !== "Tous") q.set(k, v);
    });
    if (params.status && params.status !== "Toutes") {
      q.set("status", orderStatusToApi(params.status));
    }
    const data = await apiClient.get(`/restaurant/orders?${q}`);
    const list = data.data || data;
    return {
      ...data,
      data: Array.isArray(list) ? list.map(mapOrder) : list,
    };
  },

  order: async (id) => mapOrder(await apiClient.get(`/restaurant/orders/${id}`)),

  updateOrderStatus: async (id, statusLabel) =>
    mapOrder(
      await apiClient.patch(`/restaurant/orders/${id}/status`, {
        status: orderStatusToApi(statusLabel),
      })
    ),

  // Products
  products: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const data = await apiClient.get(`/restaurant/products?${q}`);
    const list = data.data || data;
    return {
      ...data,
      data: Array.isArray(list) ? list.map(mapProduct) : list,
    };
  },

  product: async (id) => mapProduct(await apiClient.get(`/restaurant/products/${id}`)),

  createProduct: (body) =>
    apiClient.post("/restaurant/products", {
      name: body.name,
      description: body.description,
      price: Number(body.price),
      category_id: body.category_id || body.categoryId,
      is_available: body.available ?? body.is_available ?? true,
      is_featured: body.featured ?? body.is_featured ?? false,
      options: body.options,
      supplements: body.supplements,
      image: body.image,
    }),

  updateProduct: (id, body) =>
    apiClient.put(`/restaurant/products/${id}`, {
      name: body.name,
      description: body.description,
      price: body.price != null ? Number(body.price) : undefined,
      category_id: body.category_id || body.categoryId,
      is_available: body.available ?? body.is_available,
      is_featured: body.featured ?? body.is_featured,
      options: body.options,
      supplements: body.supplements,
      image: body.image,
    }),

  deleteProduct: (id) => apiClient.delete(`/restaurant/products/${id}`),

  // Categories
  categories: () => apiClient.get("/restaurant/categories"),
  createCategory: (body) => apiClient.post("/restaurant/categories", body),
  updateCategory: (id, body) => apiClient.put(`/restaurant/categories/${id}`, body),
  deleteCategory: (id) => apiClient.delete(`/restaurant/categories/${id}`),

  // Customers
  customers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/restaurant/customers?${q}`);
  },
  customer: (id) => apiClient.get(`/restaurant/customers/${id}`),

  // Delivery
  zones: () => apiClient.get("/restaurant/delivery/zones"),
  createZone: (body) => apiClient.post("/restaurant/delivery/zones", body),
  updateZone: (id, body) => apiClient.put(`/restaurant/delivery/zones/${id}`, body),
  deleteZone: (id) => apiClient.delete(`/restaurant/delivery/zones/${id}`),
  drivers: () => apiClient.get("/restaurant/delivery/drivers"),
  createDriver: (body) => apiClient.post("/restaurant/delivery/drivers", body),
  updateDriver: (id, body) => apiClient.put(`/restaurant/delivery/drivers/${id}`, body),
  pendingDelivery: async () => {
    const data = await apiClient.get("/restaurant/delivery/pending");
    const list = data.data || data;
    return Array.isArray(list) ? list.map(mapOrder) : list;
  },
  assignDriver: async (orderId, driverId) => {
    const data = await apiClient.post(`/restaurant/delivery/orders/${orderId}/assign`, { driver_id: driverId });
    return mapOrder(data.order || data);
  },
  unassignDriver: async (orderId) => {
    const data = await apiClient.post(`/restaurant/delivery/orders/${orderId}/unassign`);
    return mapOrder(data.order || data);
  },

  // Promotions
  promotions: () => apiClient.get("/restaurant/promotions"),
  createPromotion: (body) => apiClient.post("/restaurant/promotions", body),
  updatePromotion: (id, body) => apiClient.put(`/restaurant/promotions/${id}`, body),
  deletePromotion: (id) => apiClient.delete(`/restaurant/promotions/${id}`),

  // Settings / billing
  settings: () => apiClient.get("/restaurant/settings"),
  updateSettings: (body) => apiClient.put("/restaurant/settings", body),
  billing: () => apiClient.get("/restaurant/billing"),
  plans: () => apiClient.get("/restaurant/plans"),
  subscribe: (plan_id, billing_cycle = "monthly") =>
    apiClient.post("/restaurant/subscribe", { plan_id, billing_cycle }),
  cancelSubscription: () => apiClient.post("/restaurant/subscription/cancel"),

  // Team
  team: () => apiClient.get("/restaurant/team"),
  inviteTeamMember: (body) => apiClient.post("/restaurant/team", body),
  updateTeamMember: (id, body) => apiClient.put(`/restaurant/team/${id}`, body),
  removeTeamMember: (id) => apiClient.delete(`/restaurant/team/${id}`),

  // Security
  updatePassword: (body) => apiClient.put("/restaurant/security/password", body),
  twoFactorStatus: () => apiClient.get("/restaurant/security/2fa"),
  toggleTwoFactor: (body) => apiClient.put("/restaurant/security/2fa", body),
  securitySessions: () => apiClient.get("/restaurant/security/sessions"),
  revokeSecuritySession: (id) => apiClient.delete(`/restaurant/security/sessions/${id}`),

  // Support
  support: () => apiClient.get("/restaurant/support"),
  createSupportTicket: (body) => apiClient.post("/restaurant/support", body),
  supportTicket: (id) => apiClient.get(`/restaurant/support/${id}`),
  replySupportTicket: (id, body) =>
    apiClient.post(`/restaurant/support/${id}/messages`, body),
};
