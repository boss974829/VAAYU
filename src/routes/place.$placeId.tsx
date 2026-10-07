import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { Shell } from "@/components/shell";
import { getPlace } from "@/lib/places";
import { useVaayu } from "@/lib/store";
import { useVaayuReady } from "@/lib/use-ready";

export const Route = createFileRoute("/place/$placeId")({
  component: PlaceLayout,
});

function PlaceLayout() {
  const { placeId } = Route.useParams();
  const place = getPlace(placeId);
  const ready = useVaayuReady();
  const selectPlace = useVaayu((state) => state.selectPlace);

  useEffect(() => {
    if (!ready || !place) return;
    selectPlace(place.id);
  }, [ready, place, selectPlace]);

  if (!place) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg py-8">
          <h1 className="title">That place isn’t in the list</h1>
          <p className="mt-2 text-muted">Search again from the home screen.</p>
        </div>
      </Shell>
    );
  }

  return <Outlet />;
}
