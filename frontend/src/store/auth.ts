// src/store/auth.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  token: string | null;
  email: string | null;
};
type Actions = {
  setToken: (t: string | null) => void;
  setEmail: (e: string | null) => void;
  logout: () => void;
};

export const useAuth = create<State & Actions>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      setToken: (t) => set({ token: t }),
      setEmail: (e) => set({ email: e }),
      logout: () => set({ token: null, email: null }),
    }),
    { name: "auth" } // localStorage key
  )
);