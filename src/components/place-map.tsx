type PlaceMapProps = {
  lat: number;
  lon: number;
  zoom: number;
  label: string;
  pinned: boolean;
  compact?: boolean;
};

export function PlaceMap({ lat, lon, zoom, label, pinned, compact }: PlaceMapProps) {
  const query = pinned ? `${lat},${lon}` : "India";
  const src = `https://www.google.com/maps?output=embed&q=${encodeURIComponent(query)}&z=${zoom}&hl=en`;
  const open = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pinned ? `${lat},${lon}` : "India")}`;

  return (
    <div>
      <div className={compact ? "map-frame map-frame-compact" : "map-frame"}>
        <iframe
          className="vaayu-map border-0"
          title={pinned ? `Live Google Map of ${label}` : "Live Google Map of India"}
          src={src}
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <div className="pointer-events-none absolute top-3 left-3 z-10 rounded-sm bg-bg px-3 py-2">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted">Live Google Map</p>
        </div>
      </div>
      <a
        className="mt-2 inline-flex h-11 items-center text-sm font-medium"
        href={open}
        target="_blank"
        rel="noreferrer"
      >
        Open in Google Maps
      </a>
    </div>
  );
}
