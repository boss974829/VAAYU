import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AirReading } from "@/lib/air";
import type { PlaceFilter } from "@/lib/places";

export type ThemeChoice = "light" | "dark" | "system";
export type ReplayPhase = "idle" | "cleared" | "restored";

type SavedSlice = {
  selectedId: string | null;
  filter: PlaceFilter;
  query: string;
  theme: ThemeChoice;
  bookmarks: string[];
  readings: Record<string, AirReading>;
  savedAt: string | null;
};

type VaayuState = SavedSlice & {
  showRestored: boolean;
  replayPhase: ReplayPhase;
  selectPlace: (id: string) => void;
  setFilter: (filter: PlaceFilter) => void;
  setQuery: (query: string) => void;
  setTheme: (theme: ThemeChoice) => void;
  toggleBookmark: (id: string) => void;
  saveReading: (id: string, reading: AirReading) => void;
  dismissRestored: () => void;
  clearSaved: () => void;
  beginReplay: () => boolean;
  finishReplay: () => void;
};

let writeSuspended = false;

const memoryStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined" || writeSuspended) return;
    window.localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

function pruneReadings(
  readings: Record<string, AirReading>,
  id: string,
  reading: AirReading,
): Record<string, AirReading> {
  const merged = { ...readings, [id]: reading };
  const keys = Object.keys(merged);
  if (keys.length <= 24) return merged;
  const oldest = keys.sort((a, b) => (merged[a]!.fetchedAt < merged[b]!.fetchedAt ? -1 : 1));
  for (const key of oldest.slice(0, keys.length - 24)) delete merged[key];
  return merged;
}

const emptySaved = {
  selectedId: null,
  filter: "all" as const,
  query: "",
  bookmarks: [] as string[],
  readings: {} as Record<string, AirReading>,
  savedAt: null,
};

export const useVaayu = create<VaayuState>()(
  persist(
    (set, get) => ({
      ...emptySaved,
      theme: "system",
      showRestored: false,
      replayPhase: "idle",
      selectPlace: (id) => {
        if (get().selectedId === id) return;
        set({ selectedId: id, savedAt: new Date().toISOString(), showRestored: false });
      },
      setFilter: (filter) => set({ filter, savedAt: new Date().toISOString() }),
      setQuery: (query) => set({ query, savedAt: new Date().toISOString() }),
      setTheme: (theme) => set({ theme, savedAt: new Date().toISOString() }),
      toggleBookmark: (id) => {
        const bookmarks = get().bookmarks.includes(id)
          ? get().bookmarks.filter((item) => item !== id)
          : [...get().bookmarks, id];
        set({ bookmarks, savedAt: new Date().toISOString() });
      },
      saveReading: (id, reading) =>
        set({
          readings: pruneReadings(get().readings, id, reading),
          savedAt: new Date().toISOString(),
        }),
      dismissRestored: () => set({ showRestored: false, replayPhase: "idle" }),
      clearSaved: () =>
        set({
          ...emptySaved,
          theme: get().theme,
          showRestored: false,
          replayPhase: "idle",
        }),
      beginReplay: () => {
        if (!get().savedAt) return false;
        writeSuspended = true;
        set({
          selectedId: null,
          filter: "all",
          query: "",
          bookmarks: [],
          readings: {},
          showRestored: false,
          replayPhase: "cleared",
        });
        return true;
      },
      finishReplay: () => {
        writeSuspended = false;
        void Promise.resolve(useVaayu.persist.rehydrate()).then(() => {
          set({ showRestored: true, replayPhase: "restored" });
        });
      },
    }),
    {
      name: "vaayu-saved",
      storage: createJSONStorage(() => memoryStorage),
      skipHydration: true,
      partialize: (state) => ({
        selectedId: state.selectedId,
        filter: state.filter,
        query: state.query,
        theme: state.theme,
        bookmarks: state.bookmarks,
        readings: state.readings,
        savedAt: state.savedAt,
      }),
    },
  ),
);

export function suspendWrites(suspended: boolean) {
  writeSuspended = suspended;
}
