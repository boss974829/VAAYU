import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import {
  forecastIllness,
  ILLNESS_DISCLAIMER,
  riskLabel,
  riskTone,
  type IllnessRisk,
} from "@/lib/illness";
import type { Place } from "@/lib/places";
import { useAir } from "@/lib/use-air";

export function DiseaseGlance({ place }: { place: Place }) {
  const { reading } = useAir(place);
  const outlook = forecastIllness(place, reading?.usAqi);

  return (
    <Link
      to="/place/$placeId/outlook"
      params={{ placeId: place.id }}
      className="mt-6 block border-t border-border pt-4"
    >
      <p className="text-sm font-medium text-muted">Illness, next 30 days</p>
      <p className="mt-1 text-sm text-muted">{outlook.range}</p>
      <DiseaseRows items={outlook.items.slice(0, 3)} />
      <p className="mt-3 text-sm text-subtle">
        Modeled chance this is a leading concern in {place.name}. Not your personal chance of getting sick.
      </p>
    </Link>
  );
}

export function DiseaseBoard({ place }: { place: Place }) {
  const { reading } = useAir(place);
  const outlook = forecastIllness(place, reading?.usAqi);
  const lead = outlook.items[0];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{outlook.range}</p>
      {lead ? (
        <p>
          Leading concern in {place.name}: <span className="font-medium">{lead.name}</span>, {lead.probability}%.
        </p>
      ) : null}
      <ol className="flex flex-col gap-3">
        {outlook.items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium">{item.name}</p>
              <p className={cn("title tabular-nums", "band-" + riskTone(item.probability))}>{item.probability}%</p>
            </div>
            <p className="text-sm text-muted">{riskLabel(item.probability)}</p>
            <RiskMeter item={item} />
            <p className="mt-3 text-sm">{item.why}</p>
          </li>
        ))}
      </ol>
      <p className="text-sm text-subtle">{ILLNESS_DISCLAIMER}</p>
    </div>
  );
}

function DiseaseRows({ items }: { items: IllnessRisk[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium">{item.name}</span>
            <span className={cn("font-medium tabular-nums", "band-" + riskTone(item.probability))}>
              {item.probability}%
            </span>
          </div>
          <RiskMeter item={item} />
        </li>
      ))}
    </ul>
  );
}

function RiskMeter({ item }: { item: IllnessRisk }) {
  return (
    <div
      className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={item.probability}
      aria-label={`${item.name}, ${item.probability} percent`}
    >
      <div
        className={cn("h-full bg-current", "band-" + riskTone(item.probability))}
        style={{ width: `${item.probability}%` }}
      />
    </div>
  );
}
