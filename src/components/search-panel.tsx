import { filterPlaces, kindLabel, places, suggestionPlaces, type PlaceFilter } from "@/lib/places";
import { cn } from "@/lib/cn";
import { useVaayu } from "@/lib/store";

const FILTERS: { id: PlaceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "city", label: "Cities" },
  { id: "district", label: "Districts" },
];

export function SearchPanel() {
  const query = useVaayu((state) => state.query);
  const setQuery = useVaayu((state) => state.setQuery);
  const filter = useVaayu((state) => state.filter);
  const setFilter = useVaayu((state) => state.setFilter);
  const selectedId = useVaayu((state) => state.selectedId);
  const selectPlace = useVaayu((state) => state.selectPlace);
  const matches = filterPlaces(query, filter);
  const searching = query.trim().length > 0;

  function pick(id: string) {
    selectPlace(id);
    const narrow = window.innerWidth < 768;
    if (narrow) setQuery("");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (narrow) {
      document.getElementById("area-map")?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-border bg-surface p-4">
        <label className="block">
          <span className="sr-only">Search a city or district in India</span>
          <input
            className="field"
            value={query}
            placeholder="Search any Indian city"
            onChange={(event) => setQuery(event.target.value)}
            enterKeyHint="search"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Place type">
          {FILTERS.map((item) => {
            const on = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={cn(
                  "press h-11 rounded-full px-4 text-sm font-medium",
                  on ? "bg-accent text-accent-fg" : "border border-border bg-bg text-fg",
                )}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="px-1 text-sm text-muted">
        {searching
          ? matches.length === 0
            ? "No match"
            : `${Math.min(matches.length, 30)} of ${matches.length}`
          : `${places.length} places · every state and union territory`}
      </p>

      {searching ? (
        <ResultList places={matches.slice(0, 30)} selectedId={selectedId} onPick={pick} empty={matches.length === 0} />
      ) : (
        <>
          <div className="md:hidden">
            <p className="mb-2 text-sm text-muted">Start with</p>
            <ResultList
              places={suggestionPlaces(filter)}
              selectedId={selectedId}
              onPick={pick}
              empty={false}
            />
          </div>
          <div className="hidden md:block">
            <ResultList places={matches} selectedId={selectedId} onPick={pick} empty={false} />
          </div>
        </>
      )}
    </div>
  );
}

function ResultList({
  places,
  selectedId,
  onPick,
  empty,
}: {
  places: ReturnType<typeof filterPlaces>;
  selectedId: string | null;
  onPick: (id: string) => void;
  empty: boolean;
}) {
  if (empty) {
    return (
      <p className="px-1 text-sm text-muted">No match. Try Siliguri, Mysuru, or Aizawl.</p>
    );
  }
  return (
    <ul className="flex flex-col">
      {places.map((place) => {
        const selected = place.id === selectedId;
        return (
          <li key={place.id}>
            <button
              type="button"
              className={cn(
                "row press flex min-h-12 w-full items-center justify-between rounded-sm px-2 py-2 text-left",
                selected ? "bg-surface" : "bg-transparent",
              )}
              onClick={() => onPick(place.id)}
              aria-current={selected ? "true" : undefined}
            >
              <span>
                <span className="block font-medium">{place.name}</span>
                <span className="block text-sm text-muted">
                  {place.state} · {kindLabel(place.kind)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
