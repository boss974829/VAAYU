import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Bookmark, Check, FileText, Map, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatSaved } from "@/lib/format";
import { getPlace } from "@/lib/places";
import { useVaayu } from "@/lib/store";
import { useApplyTheme, useResolvedDark, useVaayuReady } from "@/lib/use-ready";

export function Shell({ children }: { children: ReactNode }) {
  const ready = useVaayuReady();
  useApplyTheme(ready);

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="title">Vaayu</p>
        <p className="mt-2 text-muted">Restoring what you saved…</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 pt-4 pb-28 md:pb-12">{children}</main>
      <MobileTabs />
    </>
  );
}

function Header() {
  const savedAt = useVaayu((state) => state.savedAt);
  const dark = useResolvedDark();
  const setTheme = useVaayu((state) => state.setTheme);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4">
        <Link to="/" className="title inline-flex h-14 items-center pr-2">
          Vaayu
        </Link>
        <DesktopTabs />
        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/saved"
            className="inline-flex h-11 items-center gap-1 px-2 text-sm text-muted"
          >
            {savedAt ? <Check className="size-4" aria-hidden="true" /> : null}
            <span>{savedAt ? "Saved" : "Not saved"}</span>
            <span className="sr-only">{formatSaved(savedAt)}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label={dark ? "Switch to light" : "Switch to dark"}
            onClick={() => setTheme(dark ? "light" : "dark")}
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}

function DesktopTabs() {
  return (
    <nav className="hidden items-center md:flex" aria-label="Sections">
      <TabLinks layout="row" />
    </nav>
  );
}

function MobileTabs() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Sections"
    >
      <TabLinks layout="grid" />
    </nav>
  );
}

function TabLinks({ layout }: { layout: "row" | "grid" }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const selectedId = useVaayu((state) => state.selectedId);
  const place = getPlace(selectedId);
  const itemClass =
    layout === "grid"
      ? "flex min-h-14 flex-col items-center justify-center gap-1 text-xs"
      : "inline-flex h-11 items-center px-3 text-sm";

  const placeActive = pathname === "/";
  const readingActive = pathname.startsWith("/place/") && !pathname.endsWith("/outlook");
  const outlookActive = pathname.endsWith("/outlook");
  const savedActive = pathname === "/saved";

  return (
    <>
      <Link to="/" className={cn(itemClass, placeActive ? "font-medium text-fg" : "text-muted")}>
        <Map className={cn("size-5", layout === "row" && "hidden")} aria-hidden="true" />
        Place
      </Link>
      {place ? (
        <Link
          to="/place/$placeId"
          params={{ placeId: place.id }}
          className={cn(itemClass, readingActive ? "font-medium text-fg" : "text-muted")}
        >
          <FileText className={cn("size-5", layout === "row" && "hidden")} aria-hidden="true" />
          Reading
        </Link>
      ) : (
        <span className={cn(itemClass, "text-subtle")} title="Choose a place first">
          <FileText className={cn("size-5", layout === "row" && "hidden")} aria-hidden="true" />
          Reading
        </span>
      )}
      {place ? (
        <Link
          to="/place/$placeId/outlook"
          params={{ placeId: place.id }}
          className={cn(itemClass, outlookActive ? "font-medium text-fg" : "text-muted")}
        >
          <Activity className={cn("size-5", layout === "row" && "hidden")} aria-hidden="true" />
          Outlook
        </Link>
      ) : (
        <span className={cn(itemClass, "text-subtle")} title="Choose a place first">
          <Activity className={cn("size-5", layout === "row" && "hidden")} aria-hidden="true" />
          Outlook
        </span>
      )}
      <Link
        to="/saved"
        className={cn(itemClass, savedActive ? "font-medium text-fg" : "text-muted")}
      >
        <Bookmark className={cn("size-5", layout === "row" && "hidden")} aria-hidden="true" />
        Saved
      </Link>
    </>
  );
}
