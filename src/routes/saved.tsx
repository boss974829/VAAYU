import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RestoredBanner } from "@/components/conditions";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/shell";
import { BAND_LABEL } from "@/lib/air";
import { formatSaved, formatStamp } from "@/lib/format";
import { getPlace, kindLabel } from "@/lib/places";
import { useVaayu } from "@/lib/store";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({ meta: [{ title: "Saved · Vaayu" }] }),
});

function SavedPage() {
  return (
    <Shell>
      <SavedScreen />
    </Shell>
  );
}

function SavedScreen() {
  const savedAt = useVaayu((state) => state.savedAt);
  const selectedId = useVaayu((state) => state.selectedId);
  const filter = useVaayu((state) => state.filter);
  const query = useVaayu((state) => state.query);
  const bookmarks = useVaayu((state) => state.bookmarks);
  const readings = useVaayu((state) => state.readings);
  const replayPhase = useVaayu((state) => state.replayPhase);
  const toggleBookmark = useVaayu((state) => state.toggleBookmark);
  const clearSaved = useVaayu((state) => state.clearSaved);
  const beginReplay = useVaayu((state) => state.beginReplay);
  const finishReplay = useVaayu((state) => state.finishReplay);
  const [confirmClear, setConfirmClear] = useState(false);
  const place = getPlace(selectedId);
  const filterLabel = filter === "all" ? "All places" : filter === "city" ? "Cities" : "Districts";

  function replay() {
    const started = beginReplay();
    if (!started) return;
    window.setTimeout(() => finishReplay(), 800);
  }

  const readingRows = Object.entries(readings)
    .map(([id, reading]) => ({ id, reading, place: getPlace(id) }))
    .filter((row) => row.place)
    .sort((a, b) => (a.reading.fetchedAt < b.reading.fetchedAt ? 1 : -1));

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <RestoredBanner />
      <div>
        <h1 className="title">Saved on this device</h1>
        <p className="mt-2 text-muted">
          {savedAt
            ? `${formatSaved(savedAt)}. If this tab closes, Vaayu opens on the same place, filter, and kept list.`
            : "Nothing is saved yet. Choose a place and it stays on this device."}
        </p>
      </div>

      {replayPhase === "cleared" ? (
        <p className="rounded-xl border border-border bg-surface p-4">
          The open view is cleared. Bringing back what was saved…
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium text-muted">Last place</h2>
        {place ? (
          <p className="mt-2">
            <Link to="/place/$placeId" params={{ placeId: place.id }} className="font-medium underline">
              {place.name}
            </Link>
            <span className="text-muted">
              {" "}
              · {place.state} · {kindLabel(place.kind)}
            </span>
          </p>
        ) : (
          <p className="mt-2">No place selected.</p>
        )}
        <p className="mt-3 text-sm text-muted">Filter: {filterLabel}</p>
        {query ? <p className="text-sm text-muted">Search: {query}</p> : null}
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted">Kept places</h2>
        {bookmarks.length === 0 ? (
          <p className="mt-2">None yet. Use Keep on a place to hold it here.</p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {bookmarks.map((id) => {
              const item = getPlace(id);
              if (!item) return null;
              return (
                <li key={id} className="flex min-h-12 items-center justify-between gap-3 border-b border-border">
                  <Link to="/place/$placeId" params={{ placeId: id }} className="font-medium">
                    {item.name}
                  </Link>
                  <Button variant="ghost" onClick={() => toggleBookmark(id)}>
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted">Saved air readings</h2>
        {readingRows.length === 0 ? (
          <p className="mt-2">No air reading is saved yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {readingRows.map((row) => (
              <li key={row.id} className="text-sm">
                <span className="font-medium">{row.place?.name}</span>
                <span className="text-muted">
                  {" "}
                  · {row.reading.usAqi} {BAND_LABEL[row.reading.band]} · {formatStamp(row.reading.fetchedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-4">
        <h2 className="text-sm font-medium text-muted">If the tab closes</h2>
        <p>Reopen Vaayu and you should land on the last place, with the same filter and kept list.</p>
        <Button variant="secondary" onClick={replay} disabled={!savedAt || replayPhase === "cleared"}>
          Replay restore
        </Button>
        <p className="text-sm text-subtle">
          Clears the open view, then brings back the last saved place. The copy on this device is not deleted.
        </p>
        {confirmClear ? (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                clearSaved();
                setConfirmClear(false);
              }}
            >
              Yes, clear saved places
            </Button>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="px-0" onClick={() => setConfirmClear(true)}>
            Clear saved places
          </Button>
        )}
      </section>
    </div>
  );
}
