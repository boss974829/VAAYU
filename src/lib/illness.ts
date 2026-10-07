import type { Place, WaterStatus } from "@/lib/places";

export type IllnessRisk = {
  id: string;
  name: string;
  probability: number;
  why: string;
};

export type IllnessOutlook = {
  range: string;
  items: IllnessRisk[];
};

type Climate =
  | "gangetic"
  | "arid"
  | "himalaya"
  | "northeast"
  | "deccan"
  | "konkan"
  | "malabar"
  | "coromandel"
  | "east";

const DENGUE = [10, 8, 8, 10, 16, 34, 54, 70, 74, 66, 42, 20];
const MALARIA = [14, 10, 12, 16, 28, 46, 60, 68, 58, 38, 22, 16];
const TYPHOID = [24, 20, 22, 30, 40, 54, 62, 58, 48, 38, 30, 26];
const DIARRHEA = [20, 16, 18, 28, 42, 58, 68, 64, 50, 36, 26, 22];
const HEAT = [6, 12, 30, 60, 78, 72, 42, 24, 14, 8, 6, 6];
const LEPTO = [4, 4, 4, 6, 12, 30, 48, 52, 42, 30, 14, 6];
const JE = [3, 3, 4, 6, 10, 20, 38, 50, 44, 30, 14, 4];
const SCRUB = [6, 5, 5, 6, 8, 14, 22, 36, 42, 36, 22, 10];
const EYE = [18, 16, 18, 24, 34, 48, 56, 52, 40, 30, 22, 18];
const ILI_NORTH = [62, 54, 36, 22, 16, 18, 24, 22, 28, 40, 55, 68];
const ILI_SOUTH = [30, 26, 24, 26, 34, 48, 56, 52, 42, 34, 30, 32];
const ILI_HILL = [50, 44, 32, 22, 14, 16, 18, 16, 20, 30, 46, 56];
const ILI_NE = [36, 32, 28, 24, 28, 40, 48, 44, 36, 32, 34, 40];
const ILI_EAST = [40, 34, 26, 20, 18, 28, 36, 32, 28, 30, 36, 44];
const RESP_NORTH = [30, 22, 12, 8, 6, 6, 8, 10, 18, 40, 56, 50];
const RESP_SOUTH = [12, 10, 8, 8, 8, 10, 12, 12, 12, 16, 18, 16];
const RESP_HILL = [16, 12, 8, 6, 4, 4, 6, 6, 8, 12, 18, 18];
const RESP_EAST = [18, 14, 10, 8, 8, 8, 10, 10, 12, 20, 26, 24];

const JE_STATES = new Set(["Uttar Pradesh", "Bihar", "Assam", "West Bengal", "Odisha"]);
const PLAIN_IDS = new Set([
  "jammu",
  "haridwar",
  "rishikesh",
  "haldwani",
  "roorkee",
  "kashipur",
  "rudrapur",
  "kotdwar",
]);
const RAYALASEEMA = new Set([
  "kurnool",
  "anantapur",
  "kadapa",
  "nandyal",
  "adoni",
  "hindupur",
  "proddatur",
]);
const GUJARAT_HUMID = new Set([
  "surat",
  "vadodara",
  "bhavnagar",
  "jamnagar",
  "junagadh",
  "bharuch",
  "porbandar",
  "veraval",
  "vapi",
  "navsari",
  "amreli",
  "anand",
  "nadiad",
  "godhra",
  "valsad",
]);

const HILL_STATES = new Set([
  "Himachal Pradesh",
  "Uttarakhand",
  "Sikkim",
  "Ladakh",
  "Jammu and Kashmir",
]);
const NORTHEAST_STATES = new Set([
  "Assam",
  "Meghalaya",
  "Manipur",
  "Mizoram",
  "Nagaland",
  "Tripura",
  "Arunachal Pradesh",
]);

function istParts(date: Date): { month: number; day: number; year: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { month: pick("month") - 1, day: pick("day"), year: pick("year") };
}

function rangeLabel(now: Date): string {
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const start = fmt.format(now).replace(/ /g, " ");
  const finish = fmt.format(end);
  const startYear = istParts(now).year;
  const endYear = istParts(end).year;
  if (startYear === endYear) {
    const short = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
    });
    return `${short.format(now)} – ${short.format(end)} ${startYear}`;
  }
  return `${start} – ${finish}`;
}

export function climateOf(place: Place): Climate {
  if (place.state === "Andaman and Nicobar Islands" || place.state === "Lakshadweep") return "malabar";
  if (PLAIN_IDS.has(place.id)) return "gangetic";
  if (place.id === "darjeeling" || place.id === "kalimpong" || place.id === "udhagamandalam") return "himalaya";
  if (HILL_STATES.has(place.state)) return "himalaya";
  if (NORTHEAST_STATES.has(place.state)) return "northeast";
  if (place.state === "Rajasthan") return "arid";
  if (place.state === "Gujarat") return GUJARAT_HUMID.has(place.id) ? "konkan" : "arid";
  if (place.state === "Goa") return "konkan";
  if (place.state === "Kerala") return "malabar";
  if (place.state === "Maharashtra") return place.lon < 73.55 && place.lat < 20.2 ? "konkan" : "deccan";
  if (place.state === "Karnataka") return place.lon < 75 && place.lat < 15.2 ? "malabar" : "deccan";
  if (place.state === "Tamil Nadu" || place.state === "Puducherry") return "coromandel";
  if (place.state === "Andhra Pradesh") return RAYALASEEMA.has(place.id) ? "deccan" : "coromandel";
  if (place.state === "Telangana" || place.state === "Madhya Pradesh") return "deccan";
  if (
    place.state === "Odisha" ||
    place.state === "West Bengal" ||
    place.state === "Jharkhand" ||
    place.state === "Chhattisgarh"
  ) {
    return "east";
  }
  return "gangetic";
}

function waterFactor(status: WaterStatus): number {
  if (status === "stressed") return 1.18;
  if (status === "watch") return 1.05;
  if (status === "steady") return 0.84;
  return 1;
}

function altitudeCut(place: Place): number {
  if (place.state === "Ladakh") return 0.45;
  return 1;
}

function blended(
  series: readonly number[],
  month: number,
  blend: number,
  factor: (monthIndex: number) => number,
): number {
  const next = (month + 1) % 12;
  const current = series[month]! * factor(month);
  const ahead = series[next]! * factor(next);
  return current * (1 - blend) + ahead * blend;
}

function asPercent(value: number): number {
  return Math.min(86, Math.max(3, Math.round(value)));
}

function dengueFactor(climate: Climate, month: number): number {
  if (climate === "arid") return 0.62;
  if (climate === "himalaya") return 0.42;
  if (climate === "coromandel") {
    if (month >= 8 && month <= 11) return 1.32;
    if (month >= 5 && month <= 7) return 0.92;
    return 0.8;
  }
  if (climate === "malabar") return 1.18;
  if (climate === "konkan") return 1.12;
  if (climate === "northeast") return 1.1;
  if (climate === "east") return 1.08;
  if (climate === "gangetic") return 1.05;
  return 1;
}

function malariaFactor(climate: Climate): number {
  if (climate === "northeast") return 1.4;
  if (climate === "east") return 1.25;
  if (climate === "malabar") return 1.05;
  if (climate === "konkan") return 0.92;
  if (climate === "gangetic") return 0.82;
  if (climate === "deccan") return 0.78;
  if (climate === "coromandel") return 0.7;
  if (climate === "arid") return 0.38;
  return 0.28;
}

function jeFactor(place: Place, climate: Climate): number {
  const easternPlain =
    (place.state === "Uttar Pradesh" && place.lon > 81.5) ||
    place.state === "Bihar" ||
    place.state === "Assam";
  if (easternPlain) return 1.65;
  if (place.state === "West Bengal" || place.state === "Odisha") return 1.15;
  if (climate === "northeast") return 1.05;
  if (climate === "east") return 0.85;
  return 0.28;
}

function leptoFactor(climate: Climate): number {
  if (climate === "malabar") return 1.45;
  if (climate === "konkan") return 1.35;
  if (climate === "northeast") return 1.05;
  if (climate === "coromandel") return 0.8;
  if (climate === "east") return 0.7;
  return 0.38;
}

function heatFactor(climate: Climate): number {
  if (climate === "arid") return 1.28;
  if (climate === "gangetic") return 1.14;
  if (climate === "deccan") return 1.1;
  if (climate === "coromandel") return 1.05;
  if (climate === "east") return 1.02;
  if (climate === "konkan") return 0.7;
  if (climate === "northeast") return 0.55;
  if (climate === "malabar") return 0.5;
  return 0.2;
}

function scrubFactor(place: Place, climate: Climate): number {
  if (place.state === "Ladakh") return 0.35;
  if (climate === "northeast") return 1.3;
  if (climate === "himalaya") return 1.15;
  if (climate === "east") return 1.08;
  if (climate === "gangetic") return 0.85;
  if (climate === "arid") return 0.4;
  return 0.72;
}

function iliSeries(climate: Climate): readonly number[] {
  if (climate === "himalaya") return ILI_HILL;
  if (climate === "northeast") return ILI_NE;
  if (climate === "east") return ILI_EAST;
  if (climate === "malabar" || climate === "konkan" || climate === "coromandel" || climate === "deccan") {
    return ILI_SOUTH;
  }
  return ILI_NORTH;
}

function respSeries(climate: Climate): readonly number[] {
  if (climate === "himalaya") return RESP_HILL;
  if (climate === "east" || climate === "northeast") return RESP_EAST;
  if (climate === "malabar" || climate === "konkan" || climate === "coromandel" || climate === "deccan") {
    return RESP_SOUTH;
  }
  return RESP_NORTH;
}

function aqiBump(aqi: number | undefined): number {
  if (aqi == null || Number.isNaN(aqi)) return 0;
  if (aqi > 200) return 24;
  if (aqi > 150) return 16;
  if (aqi > 100) return 10;
  if (aqi > 50) return 4;
  return 0;
}

function dominant(month: number, blend: number): number {
  return blend >= 0.5 ? (month + 1) % 12 : month;
}

function inMonths(month: number, from: number, to: number): boolean {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
}

export function riskTone(probability: number): "good" | "moderate" | "poor" | "severe" {
  if (probability >= 65) return "severe";
  if (probability >= 45) return "poor";
  if (probability >= 25) return "moderate";
  return "good";
}

export function riskLabel(probability: number): "Lower" | "Watch" | "Elevated" | "High" {
  if (probability >= 65) return "High";
  if (probability >= 45) return "Elevated";
  if (probability >= 25) return "Watch";
  return "Lower";
}

export function forecastIllness(place: Place, aqi?: number, now = new Date()): IllnessOutlook {
  const { month, day } = istParts(now);
  const blend = Math.min(1, Math.max(0, (day - 1) / 30));
  const focus = dominant(month, blend);
  const climate = climateOf(place);
  const wet = waterFactor(place.water.status);
  const high = altitudeCut(place);
  const waterLabel = place.water.label;

  const dengue = blended(DENGUE, month, blend, (index) => dengueFactor(climate, index)) * high;
  const malaria = blended(MALARIA, month, blend, () => malariaFactor(climate)) * high;
  const lepto = blended(LEPTO, month, blend, () => leptoFactor(climate)) * high;
  const je = blended(JE, month, blend, () => jeFactor(place, climate)) * high;
  const scrub = blended(SCRUB, month, blend, () => scrubFactor(place, climate)) * (place.state === "Ladakh" ? 1 : high);

  const drafts: IllnessRisk[] = [
    {
      id: "dengue",
      name: "Dengue",
      probability: asPercent(dengue),
      why:
        climate === "coromandel" && inMonths(focus, 8, 11)
          ? "Along this coast the northeast monsoon is the usual dengue window."
          : climate === "arid"
            ? "Dry districts usually see a smaller dengue rise than humid cities."
            : climate === "himalaya"
              ? "Cooler hill towns usually stay below the big dengue cities."
              : inMonths(focus, 5, 10)
                ? "These weeks sit in the usual post-monsoon dengue window."
                : "Dengue is usually quieter outside the monsoon window.",
    },
    {
      id: "chikungunya",
      name: "Chikungunya",
      probability: asPercent(dengue * 0.78),
      why: "Chikungunya follows the same mosquito weeks as dengue, usually a step lower.",
    },
    {
      id: "malaria",
      name: "Malaria",
      probability: asPercent(malaria),
      why:
        climate === "northeast" || climate === "east"
          ? "Rain and standing water in this belt are the usual malaria setting."
          : climate === "himalaya" || climate === "arid"
            ? "This climate is a weaker malaria setting than the humid east."
            : inMonths(focus, 5, 9)
              ? "Monsoon weeks are when malaria tends to rise."
              : "Outside the main rains, malaria is usually lower.",
    },
    {
      id: "typhoid",
      name: "Typhoid",
      probability: asPercent(blended(TYPHOID, month, blend, () => 1) * wet),
      why: `The water note is ${waterLabel}. Typhoid tracks the rainy season more than any single tap.`,
    },
    {
      id: "diarrhea",
      name: "Diarrheal illness",
      probability: asPercent(blended(DIARRHEA, month, blend, () => 1) * wet),
      why: `Stomach illness tends to rise when rain meets strained water. The note here is ${waterLabel}.`,
    },
    {
      id: "hepatitis",
      name: "Hepatitis A and E",
      probability: asPercent(blended(TYPHOID, month, blend, () => 0.74) * wet),
      why: `Hepatitis A and E travel with unsafe water, especially through the rains. The note here is ${waterLabel}.`,
    },
    {
      id: "influenza",
      name: "Influenza-like illness",
      probability: asPercent(blended(iliSeries(climate), month, blend, () => 1)),
      why:
        (climate === "gangetic" || climate === "arid" || climate === "himalaya") && inMonths(focus, 9, 1)
          ? "Cooler weeks are the usual viral-fever season in the north and the hills."
          : (climate === "malabar" || climate === "konkan" || climate === "coromandel") && inMonths(focus, 5, 8)
            ? "On the coast, viral fever often rises with the rains as well as in winter."
            : "Viral fever here follows the season, not a single outbreak report.",
    },
    {
      id: "respiratory",
      name: "Asthma and breathlessness",
      probability: asPercent(blended(respSeries(climate), month, blend, () => 1) + aqiBump(aqi)),
      why:
        aqi != null && aqi > 100
          ? `The air reading is ${Math.round(aqi)} on the US AQI scale, which adds to asthma and breathlessness on top of the season.`
          : aqi != null
            ? `The air reading is ${Math.round(aqi)}. It is not in the poor band, so this is mostly the seasonal pattern.`
            : (climate === "gangetic" || climate === "arid") && inMonths(focus, 9, 1)
              ? "Late autumn and winter are when breathlessness usually rises here. No air reading is loaded yet."
              : "This is the seasonal pattern for irritated lungs. No air reading is loaded yet.",
    },
    {
      id: "heat",
      name: "Heat illness",
      probability: asPercent(blended(HEAT, month, blend, () => heatFactor(climate))),
      why: inMonths(focus, 2, 5)
        ? "These are the hot weeks, when heat illness is the predictable risk."
        : "Heat illness usually eases outside the peak hot months.",
    },
    {
      id: "leptospirosis",
      name: "Leptospirosis",
      probability: asPercent(lepto),
      why:
        climate === "malabar" || climate === "konkan"
          ? "Floodwater and the monsoon are the usual leptospirosis setting on this coast."
          : "Leptospirosis is less typical here than on the wet west coast.",
    },
    {
      id: "encephalitis",
      name: "Japanese encephalitis",
      probability: asPercent(je),
      why: JE_STATES.has(place.state)
        ? "This state sits in the usual Japanese encephalitis belt during the rains."
        : "Japanese encephalitis is uncommon here compared with the eastern river plains.",
    },
    {
      id: "scrub",
      name: "Scrub typhus",
      probability: asPercent(scrub),
      why:
        climate === "northeast" || climate === "himalaya" || climate === "east"
          ? "Scrub after the rains is the usual setting for scrub typhus."
          : "Scrub typhus is a smaller seasonal risk outside the wetter hills and the east.",
    },
    {
      id: "conjunctivitis",
      name: "Conjunctivitis",
      probability: asPercent(
        blended(EYE, month, blend, () => (climate === "himalaya" ? 0.75 : climate === "arid" ? 0.82 : 1)),
      ),
      why: inMonths(focus, 5, 8)
        ? "Eye infections often spread more easily in the humid months."
        : "Conjunctivitis is usually lower outside the humid months.",
    },
  ];

  const ranked = drafts.sort((a, b) => b.probability - a.probability || a.name.localeCompare(b.name));
  const notable = ranked.filter((item) => item.probability >= 12);
  const items = (notable.length >= 4 ? notable : ranked).slice(0, 7);

  return { range: rangeLabel(now), items };
}

export const ILLNESS_DISCLAIMER =
  "These percentages are a seasonal model for the next 30 days: how likely each illness is to be among the leading local concerns. They are not your personal chance of getting sick, not a diagnosis, and not a health-department bulletin.";

