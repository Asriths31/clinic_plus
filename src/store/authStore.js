import { create } from 'zustand';
import { authApi } from '../api/authApi';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  checkAuth: async () => {
    try {
      const res = await authApi.getMe();
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    const res = await authApi.login(credentials);
    set({ user: res.user, isAuthenticated: true, isLoading: false });
    return res;
  },

  register: async (data) => {
    const res = await authApi.register(data);
    return res;
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));

export default useAuthStore;
