import { apiClient } from "../lib/apiClient";
import { mapOrder } from "../lib/mappers";

export const adminApi = {
  dashboard: () => apiClient.get("/admin/dashboard"),

  restaurants: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/restaurants?${q}`);
  },
  restaurant: (id) => apiClient.get(`/admin/restaurants/${id}`),
  updateRestaurantStatus: (id, status) =>
    apiClient.patch(`/admin/restaurants/${id}/status`, { status }),

  subscriptions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/subscriptions?${q}`);
  },
  plans: () => apiClient.get("/admin/plans"),
  createPlan: (body) => apiClient.post("/admin/plans", body),
  updatePlan: (id, body) => apiClient.put(`/admin/plans/${id}`, body),

  payments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/payments?${q}`);
  },
  refundPayment: (id) => apiClient.post(`/admin/payments/${id}/refund`),

  users: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/users?${q}`);
  },
  createAdminUser: (body) => apiClient.post("/admin/users", body),
  updateUserStatus: (id, is_active) =>
    apiClient.patch(`/admin/users/${id}/status`, { is_active }),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),

  orders: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const data = await apiClient.get(`/admin/orders?${q}`);
    const list = data.data || data;
    return {
      ...data,
      data: Array.isArray(list) ? list.map(mapOrder) : list,
    };
  },
  order: async (id) => mapOrder(await apiClient.get(`/admin/orders/${id}`)),

  support: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/support?${q}`);
  },
  supportTicket: (id) => apiClient.get(`/admin/support/${id}`),
  updateTicket: (id, body) => apiClient.patch(`/admin/support/${id}`, body),
  replyTicket: (id, body) =>
    apiClient.post(`/admin/support/${id}/messages`, body),

  settings: () => apiClient.get("/admin/settings"),
  updateSettings: (body) => apiClient.put("/admin/settings", body),
  revokeSession: (tokenId) => apiClient.delete(`/admin/sessions/${tokenId}`),
};
