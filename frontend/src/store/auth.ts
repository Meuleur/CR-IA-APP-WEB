import { create } from "zustand";

type State = { token: string | null };
type Actions = {
  setToken: (t: string | null) => void;
};
export const useAuth = create<State & Actions>((set) => ({
  token: null,
  setToken: (t) => set({ token: t }),
}));
