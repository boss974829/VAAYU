import { useEffect, useState } from "react";
import type { ThemeChoice } from "@/lib/store";
import { useVaayu } from "@/lib/store";

let hydrated = false;
let hydrating: Promise<void> | null = null;

function ensureHydrated(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    hydrating = Promise.resolve(useVaayu.persist.rehydrate())
      .then(() => {
        hydrated = true;
        const state = useVaayu.getState();
        const meaningful = Boolean(
          state.savedAt &&
            (state.selectedId ||
              state.bookmarks.length ||
              state.query ||
              state.filter !== "all" ||
              Object.keys(state.readings).length),
        );
        if (meaningful) useVaayu.setState({ showRestored: true });
      })
      .catch(() => {
        hydrated = true;
      });
  }
  return hydrating ?? Promise.resolve();
}

export function useVaayuReady(): boolean {
  const [ready, setReady] = useState(hydrated);

  useEffect(() => {
    let cancelled = false;
    void ensureHydrated().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}

function prefersDark(theme: ThemeChoice): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useApplyTheme(ready: boolean) {
  const theme = useVaayu((state) => state.theme);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const apply = () => root.classList.toggle("dark", prefersDark(theme));
    apply();
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [ready, theme]);
}

export function useResolvedDark(): boolean {
  const theme = useVaayu((state) => state.theme);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setDark(prefersDark(theme));
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return dark;
}
