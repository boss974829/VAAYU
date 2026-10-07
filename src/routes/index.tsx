import { createFileRoute } from "@tanstack/react-router";
import { PlaceMap } from "@/components/place-map";
import { DiseaseGlance } from "@/components/disease-outlook";
import { AirGlance, PeopleGlance, PlaceHeading, RestoredBanner, WaterGlance } from "@/components/conditions";
import { SearchPanel } from "@/components/search-panel";
import { Shell } from "@/components/shell";
import { getPlace } from "@/lib/places";
import { useVaayu } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({ meta: [{ title: "Vaayu" }] }),
});

function Home() {
  return (
    <Shell>
      <HomeScreen />
    </Shell>
  );
}

function HomeScreen() {
  const selectedId = useVaayu((state) => state.selectedId);
  const place = getPlace(selectedId);

  return (
    <div className="home-grid">
      <div className="side-scroll">
        <SearchPanel />
      </div>
      <div className="min-w-0">
        <RestoredBanner />
        <div id="area-map" className="anchor">
          <PlaceMap
            lat={place?.lat ?? 22.5}
            lon={place?.lon ?? 79}
            zoom={place ? 12 : 5}
            label={place ? place.name : "India"}
            pinned={Boolean(place)}
          />
        </div>
        {place ? (
          <div className="mt-5">
            <PlaceHeading place={place} />
            <DiseaseGlance place={place} />
            <AirGlance place={place} />
            <WaterGlance place={place} />
            <PeopleGlance place={place} />
          </div>
        ) : (
          <div className="mt-6 max-w-md">
            <h1 className="title">Choose a city</h1>
            <p className="mt-2 text-muted">
              Every state and union territory is in the list. Pick one to see a live Google map and the illnesses most likely to lead the next 30 days, with a probability for each.
            </p>
          </div>
        )}
        <p className="mt-8 text-sm text-subtle">
          Air is a live model. Illness percentages are a seasonal forecast, not a diagnosis. Population is a rounded 2011 census figure where we have one.
        </p>
      </div>
    </div>
  );
}
