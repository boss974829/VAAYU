import { createFileRoute, Link } from "@tanstack/react-router";
import { DiseaseBoard } from "@/components/disease-outlook";
import { PlaceMap } from "@/components/place-map";
import { Shell } from "@/components/shell";
import { buildOutlook } from "@/lib/copy";
import { getPlace } from "@/lib/places";
import { useAir } from "@/lib/use-air";

export const Route = createFileRoute("/place/$placeId/outlook")({
  component: OutlookPage,
  head: ({ params }) => {
    const place = getPlace(params.placeId);
    return { meta: [{ title: place ? `${place.name} illness outlook · Vaayu` : "Outlook · Vaayu" }] };
  },
});

function OutlookPage() {
  const { placeId } = Route.useParams();
  const place = getPlace(placeId);
  const { reading } = useAir(place ?? null);

  if (!place) return null;

  const lines = buildOutlook(place, reading);

  return (
    <Shell>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <div>
          <Link to="/place/$placeId" params={{ placeId: place.id }} className="text-sm text-muted">
            {place.name} reading
          </Link>
          <h1 className="title mt-3">Illness outlook</h1>
          <p className="mt-2 text-muted">
            Predictable seasonal risks for {place.name}, with a modeled probability for the next 30 days.
          </p>
        </div>
        <PlaceMap lat={place.lat} lon={place.lon} zoom={12} label={place.name} pinned compact />
        <DiseaseBoard place={place} />
        <section className="border-t border-border pt-6">
          <h2 className="text-sm font-medium text-muted">Air and water in the same window</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </Shell>
  );
}
