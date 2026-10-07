import { useEffect, useState } from "react";
import { fetchAir, type AirReading } from "@/lib/air";
import type { Place } from "@/lib/places";
import { useVaayu } from "@/lib/store";

export type AirPhase = "checking" | "live" | "saved" | "missing";

export function useAir(place: Place | null): { reading: AirReading | undefined; phase: AirPhase } {
  const id = place?.id;
  const reading = useVaayu((state) => (id ? state.readings[id] : undefined));
  const saveReading = useVaayu((state) => state.saveReading);
  const [phase, setPhase] = useState<AirPhase>(reading ? "saved" : "checking");

  useEffect(() => {
    if (!place) return;
    let cancelled = false;
    const controller = new AbortController();
    setPhase("checking");
    fetchAir(place.lat, place.lon, controller.signal)
      .then((next) => {
        if (cancelled) return;
        saveReading(place.id, next);
        setPhase("live");
      })
      .catch(() => {
        if (cancelled || controller.signal.aborted) return;
        const has = Boolean(useVaayu.getState().readings[place.id]);
        setPhase(has ? "saved" : "missing");
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [place, saveReading]);

  return { reading, phase };
}
