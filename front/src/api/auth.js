import { apiClient, setSession, clearSession } from "../lib/apiClient";

export const authApi = {
  login: async (email, password) => {
    const data = await apiClient.post("/auth/login", { email, password }, { auth: false });
    if (data.token) setSession({ token: data.token, user: data.user });
    return data;
  },

  verifyTwoFactor: async (email, code) => {
    const data = await apiClient.post("/auth/two-factor", { email, code }, { auth: false });
    if (data.token) setSession({ token: data.token, user: data.user });
    return data;
  },

  register: async (payload) => {
    const data = await apiClient.post(
      "/auth/register",
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        password_confirmation: payload.password_confirmation || payload.password,
        restaurant_name: payload.restaurant_name || payload.restaurantName,
      },
      { auth: false }
    );
    setSession({ token: data.token, user: data.user });
    return data;
  },

  me: () => apiClient.get("/auth/me"),

  updateProfile: (payload) => apiClient.put("/auth/profile", payload),

  logout: async () => {
    try {
      await apiClient.post("/auth/logout", {});
    } catch {
      /* ignore */
    }
    clearSession();
  },

  forgotPassword: (email) =>
    apiClient.post("/auth/forgot-password", { email }, { auth: false }),

  resendVerification: () => apiClient.post("/auth/email/resend", {}),
};
