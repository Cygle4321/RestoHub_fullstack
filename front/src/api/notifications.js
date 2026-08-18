import { apiClient } from "../lib/apiClient";

export const notificationApi = {
  list: () => apiClient.get("/notifications"),
  markAllRead: () => apiClient.post("/notifications/read"),
  markRead: (id) => apiClient.post(`/notifications/${id}/read`),
};