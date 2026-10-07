import { createFileRoute } from "@tanstack/react-router";
import { Reading } from "@/components/conditions";
import { Shell } from "@/components/shell";
import { getPlace } from "@/lib/places";

export const Route = createFileRoute("/place/$placeId/")({
  component: PlaceIndex,
  head: ({ params }) => {
    const place = getPlace(params.placeId);
    return { meta: [{ title: place ? `${place.name} · Vaayu` : "Vaayu" }] };
  },
});

function PlaceIndex() {
  const { placeId } = Route.useParams();
  const place = getPlace(placeId);
  if (!place) return null;

  return (
    <Shell>
      <Reading place={place} />
    </Shell>
  );
}
