import { create } from "zustand";
import { apiPost } from "@/lib/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  setUser: (user: AuthUser | null, token?: string) => void;
  hydrate: () => void;
  signInDemo: () => void;
  signOut: () => void;
};

const storageKey = "ledgerly:auth";
const tokenKey = "ledgerly:token";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  setUser: (user, token) => {
    set({ user });
    if (user) {
      localStorage.setItem(storageKey, JSON.stringify(user));
      if (token) localStorage.setItem(tokenKey, token);
    } else {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(tokenKey);
    }
  },
  hydrate: () => {
    if (get().hydrated) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      set({ hydrated: true });
      return;
    }
    try {
      const user = JSON.parse(raw) as AuthUser;
      set({ user, hydrated: true });
    } catch {
      localStorage.removeItem(storageKey);
      set({ hydrated: true });
    }
  },
  signInDemo: () => {
    get().setUser({
      id: "demo",
      name: "Demo User",
      email: "demo@ledgerly.app",
    }, "demo-token");
  },
  signOut: () => {
    get().setUser(null);
  },
}));

