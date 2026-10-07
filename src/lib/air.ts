export type AqiBand = "good" | "moderate" | "poor" | "severe";

export type AirPoint = {
  t: string;
  aqi: number;
};

export type AirReading = {
  usAqi: number;
  band: AqiBand;
  history: AirPoint[];
  forecast: AirPoint[];
  observedAt: string;
  fetchedAt: string;
  source: "Open-Meteo air model";
};

export type Trend = "rising" | "easing" | "steady" | "unclear";

export const BAND_LABEL: Record<AqiBand, string> = {
  good: "Good",
  moderate: "Moderate",
  poor: "Poor",
  severe: "Severe",
};

export function bandFrom(value: number): AqiBand {
  if (value <= 50) return "good";
  if (value <= 100) return "moderate";
  if (value <= 200) return "poor";
  return "severe";
}

export function trendOf(values: number[]): Trend {
  if (values.length < 8) return "unclear";
  const recent = average(values.slice(-6));
  const prior = average(values.slice(-12, -6));
  const delta = recent - prior;
  if (delta >= 12) return "rising";
  if (delta <= -12) return "easing";
  return "steady";
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toIstIso(stamp: string): string {
  if (/[zZ]$|[+-]\d\d:\d\d$/.test(stamp)) return stamp;
  return `${stamp}+05:30`;
}

export async function fetchAir(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<AirReading> {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "us_aqi");
  url.searchParams.set("hourly", "us_aqi");
  url.searchParams.set("timezone", "Asia/Kolkata");
  url.searchParams.set("past_days", "2");
  url.searchParams.set("forecast_days", "2");

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("The air service didn’t respond.");
  }

  const data = (await response.json()) as {
    current?: { time?: string; us_aqi?: number | null };
    hourly?: { time?: string[]; us_aqi?: Array<number | null> };
  };

  const currentRaw = data.current?.us_aqi;
  const currentTime = data.current?.time;
  if (currentRaw == null || Number.isNaN(currentRaw) || !currentTime) {
    throw new Error("No air number came back for this place.");
  }

  const now = Date.now();
  const history: AirPoint[] = [];
  const forecast: AirPoint[] = [];
  const times = data.hourly?.time ?? [];
  const values = data.hourly?.us_aqi ?? [];

  for (let index = 0; index < times.length; index += 1) {
    const raw = values[index];
    const stamp = times[index];
    if (raw == null || Number.isNaN(raw) || !stamp) continue;
    const t = toIstIso(stamp);
    const ms = new Date(t).getTime();
    if (Number.isNaN(ms)) continue;
    const point = { t, aqi: Math.round(raw) };
    if (ms <= now + 30 * 60 * 1000) history.push(point);
    else forecast.push(point);
  }

  const usAqi = Math.round(currentRaw);
  return {
    usAqi,
    band: bandFrom(usAqi),
    history: history.slice(-48),
    forecast: forecast.slice(0, 36),
    observedAt: toIstIso(currentTime),
    fetchedAt: new Date().toISOString(),
    source: "Open-Meteo air model",
  };
}
