import { Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BAND_LABEL, trendOf, type AirReading } from "@/lib/air";
import { cn } from "@/lib/cn";
import { airMeaning, peopleMeaning, rangeLine, trendLine, waterMeaning } from "@/lib/copy";
import { formatStamp } from "@/lib/format";
import { getPlace, kindLabel, type Place } from "@/lib/places";
import { useVaayu } from "@/lib/store";
import { useAir, type AirPhase } from "@/lib/use-air";

const AqiChart = lazy(() => import("@/components/aqi-chart"));

export function KeepButton({ id }: { id: string }) {
  const on = useVaayu((state) => state.bookmarks.includes(id));
  const toggle = useVaayu((state) => state.toggleBookmark);
  return (
    <Button variant="secondary" aria-pressed={on} onClick={() => toggle(id)}>
      <Bookmark className="size-4" fill={on ? "currentColor" : "none"} aria-hidden="true" />
      {on ? "Kept" : "Keep"}
    </Button>
  );
}

export function PlaceHeading({ place }: { place: Place }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="title">{place.name}</h1>
        <p className="text-sm text-muted">
          {place.state} · {kindLabel(place.kind)}
        </p>
      </div>
      <KeepButton id={place.id} />
    </div>
  );
}

function airStatus(phase: AirPhase, reading: AirReading | undefined): string | null {
  if (phase === "checking" && reading) return "Checking for a newer reading…";
  if (phase === "checking") return "Checking the air reading…";
  if (phase === "saved") return "The live reading didn’t load. Showing the last saved value.";
  if (phase === "missing") return "No air reading yet, and the live check didn’t load.";
  return null;
}

export function AirGlance({ place }: { place: Place }) {
  const { reading, phase } = useAir(place);
  const status = airStatus(phase, reading);
  const trend = reading ? trendOf(reading.history.map((point) => point.aqi)) : "unclear";

  return (
    <Link
      to="/place/$placeId"
      params={{ placeId: place.id }}
      hash="air"
      className="anchor mt-6 block border-t border-border pt-4"
    >
      <p className="text-sm font-medium text-muted">Air</p>
      {reading ? (
        <>
          <p className={cn("figure band-" + reading.band)}>{reading.usAqi}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn("band-chip", "band-chip-" + reading.band)}>{BAND_LABEL[reading.band]}</span>
            <span className="text-sm text-muted">{trendLine(trend)}</span>
          </p>
          <p className="mt-2 text-sm text-muted">Updated {formatStamp(reading.observedAt)}</p>
        </>
      ) : (
        <AirPlaceholder />
      )}
      {status ? <p className="mt-2 text-sm">{status}</p> : null}
      <p className="mt-2 text-sm text-subtle">US AQI. A standard air index — lower is cleaner. This is a model, not a government station.</p>
    </Link>
  );
}

export function WaterGlance({ place }: { place: Place }) {
  return (
    <Link
      to="/place/$placeId"
      params={{ placeId: place.id }}
      hash="water"
      className="mt-2 block border-t border-border py-4"
    >
      <p className="text-sm font-medium text-muted">Water</p>
      <p className="stat mt-1">{place.water.label}</p>
      <p className="mt-2 text-sm text-muted">Updated {place.water.asOf}</p>
    </Link>
  );
}

export function PeopleGlance({ place }: { place: Place }) {
  return (
    <Link
      to="/place/$placeId"
      params={{ placeId: place.id }}
      hash="people"
      className="block border-t border-border py-4"
    >
      <p className="text-sm font-medium text-muted">People</p>
      {place.population ? (
        <>
          <p className="stat mt-1">{place.population.label}</p>
          <p className="mt-2 text-sm text-muted">{place.population.share}</p>
          <p className="mt-2 text-sm text-muted">Updated {place.population.asOf}</p>
        </>
      ) : (
        <>
          <p className="stat mt-1">Not loaded</p>
          <p className="mt-2 text-sm">No census figure is saved for this area.</p>
        </>
      )}
    </Link>
  );
}

export function Reading({ place }: { place: Place }) {
  const { reading, phase } = useAir(place);
  const status = airStatus(phase, reading);
  const trend = reading ? trendOf(reading.history.map((point) => point.aqi)) : "unclear";
  const range = rangeLine(reading);

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
      <div>
        <Link to="/" className="text-sm text-muted">
          All places
        </Link>
        <div className="mt-3">
          <PlaceHeading place={place} />
        </div>
      </div>

      <section id="air" className="anchor">
        <h2 className="text-sm font-medium text-muted">Air</h2>
        {reading ? (
          <>
            <p className={cn("figure mt-2 band-" + reading.band)}>{reading.usAqi}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={cn("band-chip", "band-chip-" + reading.band)}>{BAND_LABEL[reading.band]}</span>
            </div>
            <p className="mt-3">{trendLine(trend)}</p>
            {range ? <p className="mt-1 text-sm text-muted">{range}</p> : null}
            <p className="mt-2 text-sm text-muted">Updated {formatStamp(reading.observedAt)}</p>
            {phase === "saved" ? (
              <p className="mt-1 text-sm text-muted">Last saved {formatStamp(reading.fetchedAt)}</p>
            ) : null}
          </>
        ) : (
          <AirPlaceholder />
        )}
        {status ? <p className="mt-2 text-sm">{status}</p> : null}
        <p className="mt-2 text-sm text-subtle">
          US AQI runs from clean to severe: good 0–50, moderate 51–100, poor 101–200, severe over 200. This number is an air model, not a CPCB station.
        </p>
        {reading && reading.history.length > 2 ? <TrendChart points={reading.history} /> : null}
      </section>

      <section id="water" className="anchor border-t border-border pt-6">
        <h2 className="text-sm font-medium text-muted">Water</h2>
        <p className="stat mt-2">{place.water.label}</p>
        <p className="mt-3">{place.water.note}</p>
        <p className="mt-2 text-sm text-muted">Updated {place.water.asOf}</p>
      </section>

      <section id="people" className="anchor border-t border-border pt-6">
        <h2 className="text-sm font-medium text-muted">People</h2>
        {place.population ? (
          <>
            <p className="stat mt-2">{place.population.label}</p>
            <p className="mt-3">{place.population.scope}</p>
            <p className="mt-1">{place.population.share}</p>
            {place.population.density ? <p className="mt-1">{place.population.density}</p> : null}
            {place.population.comparison ? <p className="mt-1">{place.population.comparison}</p> : (
              <p className="mt-1 text-sm text-muted">Density isn’t shown — the boundary for this count isn’t loaded.</p>
            )}
            <p className="mt-2 text-sm text-muted">Updated {place.population.asOf}</p>
          </>
        ) : (
          <>
            <p className="stat mt-2">Not loaded</p>
            <p className="mt-3">No census figure is loaded for this area, and no earlier count is saved.</p>
          </>
        )}
      </section>

      <section id="means" className="anchor border-t border-border pt-6">
        <h2 className="text-sm font-medium text-muted">What this means</h2>
        <div className="mt-3 flex flex-col gap-3">
          <p>{airMeaning(reading)}</p>
          <p>{waterMeaning(place)}</p>
          <p>{peopleMeaning(place)}</p>
        </div>
      </section>

      <Button variant="secondary" asChild>
        <Link to="/place/$placeId/outlook" params={{ placeId: place.id }}>
          Illness outlook
        </Link>
      </Button>
      <p className="text-sm text-subtle">
        Air comes from the Open-Meteo model when the network works. Population is a rounded 2011 census figure where we have one. Water lines are context, not lab tests.
      </p>
    </div>
  );
}

function AirPlaceholder() {
  return (
    <div className="mt-3">
      <div className="h-16 w-28 animate-pulse rounded-sm bg-border" />
      <p className="mt-3 text-sm text-muted">Updated — no figure yet</p>
    </div>
  );
}

function TrendChart({ points }: { points: AirReading["history"] }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  return (
    <div className="mt-4" aria-hidden="true">
      {on ? (
        <Suspense fallback={<div className="h-40 rounded-md bg-surface" />}>
          <AqiChart points={points} />
        </Suspense>
      ) : (
        <div className="h-40 rounded-md bg-surface" />
      )}
    </div>
  );
}

export function RestoredBanner() {
  const show = useVaayu((state) => state.showRestored);
  const selectedId = useVaayu((state) => state.selectedId);
  const bookmarks = useVaayu((state) => state.bookmarks);
  const dismiss = useVaayu((state) => state.dismissRestored);
  if (!show) return null;
  const place = getPlace(selectedId);
  const message = place
    ? `Back to ${place.name}. Your filter and kept places came back with it.`
    : bookmarks.length
      ? "Your kept places and filter came back."
      : "Your filter came back.";

  return (
    <div className="mb-4 rounded-xl border border-border bg-surface p-4">
      <p className="font-medium">Restored</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      <Button variant="ghost" className="mt-2 px-0" onClick={dismiss}>
        Dismiss
      </Button>
    </div>
  );
}
