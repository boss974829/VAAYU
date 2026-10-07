import { EXTRA_CITIES, type ExtraCity } from "@/lib/india-cities";

export type PlaceKind = "city" | "district";
export type WaterStatus = "steady" | "watch" | "stressed" | "unknown";
export type PlaceFilter = "all" | "city" | "district";

export type Population = {
  label: string;
  scope: string;
  share: string;
  density: string | null;
  comparison: string | null;
  asOf: string;
};

export type Water = {
  status: WaterStatus;
  label: string;
  note: string;
  asOf: string;
};

export type Place = {
  id: string;
  name: string;
  kind: PlaceKind;
  state: string;
  lat: number;
  lon: number;
  aliases: string[];
  population: Population | null;
  water: Water;
};

const INDIA_2011 = 1_210_854_977;
const DENSITY_2011 = 382;

const WATER_LABEL: Record<WaterStatus, string> = {
  steady: "Steady",
  watch: "Watch",
  stressed: "Stressed",
  unknown: "No note",
};

const WATER_AS_OF = "October 2026 · context note, not a sensor";
const POP_AS_OF = "Census of India 2011, rounded · not a live count";

type Seed = {
  id: string;
  name: string;
  kind: PlaceKind;
  state: string;
  lat: number;
  lon: number;
  aliases?: string[];
  /** Raw Census 2011 count. Omitted when we do not have a sourced figure. */
  census?: number;
  /** km² paired with that count. Omitted when the boundary does not match. */
  areaKm2?: number;
  urban?: boolean;
  water: WaterStatus;
  waterNote: string;
};

function peopleLabel(count: number): { rounded: number; label: string } {
  if (count >= 1_000_000) {
    const millions = Math.round(count / 100_000) / 10;
    const text = Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1);
    return { rounded: Math.round(millions * 1_000_000), label: `about ${text} million` };
  }
  const thousands = Math.max(10, Math.round(count / 10_000) * 10);
  return {
    rounded: thousands * 1000,
    label: `about ${thousands.toLocaleString("en-IN")} thousand`,
  };
}

function shareLabel(rounded: number): string {
  const pct = (rounded / INDIA_2011) * 100;
  if (pct >= 1) {
    const shown = Math.round(pct * 10) / 10;
    const text = Number.isInteger(shown) ? shown.toFixed(0) : shown.toFixed(1);
    return `about ${text}% of India’s 2011 population`;
  }
  return "under 1% of India’s 2011 population";
}

function densityParts(
  rounded: number,
  areaKm2: number,
): { density: string; comparison: string } {
  const area = areaKm2 >= 100 ? Math.round(areaKm2 / 10) * 10 : Math.round(areaKm2);
  const density = rounded / area;
  const shown = density >= 1000 ? Math.round(density / 100) * 100 : Math.round(density / 10) * 10;
  const ratio = density / DENSITY_2011;
  let comparison = "Less dense than India in 2011";
  if (ratio >= 5) comparison = "Much denser than India in 2011";
  else if (ratio >= 1.5) comparison = "Denser than India in 2011";
  else if (ratio >= 0.75) comparison = "Close to India’s 2011 average density";
  return {
    density: `about ${shown.toLocaleString("en-IN")} people per km²`,
    comparison: `${comparison} (about 380 per km²).`,
  };
}

function toPlace(seed: Seed): Place {
  let population: Population | null = null;
  if (seed.census) {
    const { rounded, label } = peopleLabel(seed.census);
    const density = seed.areaKm2 ? densityParts(rounded, seed.areaKm2) : null;
    population = {
      label,
      scope: seed.urban ? "2011 urban area, rounded" : "2011 city population, rounded",
      share: shareLabel(rounded),
      density: density?.density ?? null,
      comparison: density?.comparison ?? null,
      asOf: POP_AS_OF,
    };
  }
  return {
    id: seed.id,
    name: seed.name,
    kind: seed.kind,
    state: seed.state,
    lat: seed.lat,
    lon: seed.lon,
    aliases: seed.aliases ?? [],
    population,
    water: {
      status: seed.water,
      label: WATER_LABEL[seed.water],
      note: seed.waterNote,
      asOf: WATER_AS_OF,
    },
  };
}

function extraSeed(city: ExtraCity): Seed {
  const note =
    city.water === "stressed"
      ? `${city.name} is in a dry belt where water is often scarce. This is regional context, not a test of the tap.`
      : city.water === "steady"
        ? `No shortage is flagged for ${city.name} in this note. It is still not a lab result.`
        : `Monsoon rain and local water are the context for ${city.name}. No live test is loaded.`;
  return {
    id: city.id,
    name: city.name,
    kind: "city",
    state: city.state,
    lat: city.lat,
    lon: city.lon,
    aliases: city.aliases,
    water: city.water,
    waterNote: note,
  };
}

const SEEDS: Seed[] = [
  {
    id: "delhi",
    name: "Delhi",
    kind: "city",
    state: "Delhi",
    lat: 28.6139,
    lon: 77.209,
    aliases: ["New Delhi", "NCT"],
    census: 16349831,
    urban: true,
    water: "stressed",
    waterNote:
      "The Yamuna through Delhi is widely described as badly polluted. This is river context, not a test of your tap.",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    kind: "city",
    state: "Maharashtra",
    lat: 19.076,
    lon: 72.8777,
    aliases: ["Bombay"],
    census: 12442373,
    areaKm2: 603,
    water: "watch",
    waterNote: "Monsoon flooding and coastal water are the recurring themes. No live test is loaded.",
  },
  {
    id: "kolkata",
    name: "Kolkata",
    kind: "city",
    state: "West Bengal",
    lat: 22.5726,
    lon: 88.3639,
    aliases: ["Calcutta"],
    census: 14112536,
    areaKm2: 1886.67,
    water: "watch",
    waterNote: "The Hooghly is the river people mean when they talk about water here. No live test is loaded.",
  },
  {
    id: "chennai",
    name: "Chennai",
    kind: "city",
    state: "Tamil Nadu",
    lat: 13.0827,
    lon: 80.2707,
    aliases: ["Madras"],
    census: 8653521,
    areaKm2: 932.47,
    water: "watch",
    waterNote: "Chennai has lived through both scarcity and floods. No live test is loaded.",
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    kind: "city",
    state: "Karnataka",
    lat: 12.9716,
    lon: 77.5946,
    aliases: ["Bangalore"],
    census: 8520435,
    areaKm2: 748.42,
    water: "stressed",
    waterNote:
      "Lakes around the city are often reported as polluted, and supply can run short. This is not a tap test.",
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    kind: "city",
    state: "Telangana",
    lat: 17.385,
    lon: 78.4867,
    census: 6971622,
    areaKm2: 962.3,
    water: "watch",
    waterNote: "Lakes and groundwater are the usual water story here. No live test is loaded.",
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    kind: "city",
    state: "Gujarat",
    lat: 23.0225,
    lon: 72.5714,
    census: 6357693,
    areaKm2: 1060.95,
    water: "watch",
    waterNote: "The Sabarmati is the river context. No live test is loaded.",
  },
  {
    id: "pune",
    name: "Pune",
    kind: "city",
    state: "Maharashtra",
    lat: 18.5204,
    lon: 73.8567,
    census: 5057709,
    areaKm2: 502.78,
    water: "watch",
    waterNote: "Dams and monsoon rain feed the city. No live test is loaded.",
  },
  {
    id: "surat",
    name: "Surat",
    kind: "city",
    state: "Gujarat",
    lat: 21.1702,
    lon: 72.8311,
    census: 4467797,
    areaKm2: 335.82,
    water: "watch",
    waterNote: "The Tapi is the river context. No live test is loaded.",
  },
  {
    id: "jaipur",
    name: "Jaipur",
    kind: "city",
    state: "Rajasthan",
    lat: 26.9124,
    lon: 75.7873,
    census: 3046163,
    areaKm2: 484.64,
    water: "watch",
    waterNote: "The city depends heavily on groundwater. No live test is loaded.",
  },
  {
    id: "kanpur",
    name: "Kanpur",
    kind: "city",
    state: "Uttar Pradesh",
    lat: 26.4499,
    lon: 80.3319,
    census: 2920496,
    areaKm2: 301.16,
    water: "stressed",
    waterNote:
      "The Ganga near Kanpur has a long public record of industrial pollution. This is river context, not a tap test.",
  },
  {
    id: "lucknow",
    name: "Lucknow",
    kind: "city",
    state: "Uttar Pradesh",
    lat: 26.8467,
    lon: 80.9462,
    census: 2817105,
    areaKm2: 348.8,
    water: "watch",
    waterNote: "The Gomti is often described as under pressure. This is not a tap test.",
  },
  {
    id: "nagpur",
    name: "Nagpur",
    kind: "city",
    state: "Maharashtra",
    lat: 21.1458,
    lon: 79.0882,
    census: 2497870,
    areaKm2: 229.2,
    water: "watch",
    waterNote: "Lakes and the Nag river are the local water context. No live test is loaded.",
  },
  {
    id: "indore",
    name: "Indore",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 22.7196,
    lon: 75.8577,
    census: 2170295,
    areaKm2: 233.6,
    water: "watch",
    waterNote: "The city has worked on its rivers after years of stress. No live test is loaded.",
  },
  {
    id: "kochi",
    name: "Kochi",
    kind: "city",
    state: "Kerala",
    lat: 9.9312,
    lon: 76.2673,
    aliases: ["Cochin"],
    census: 2119724,
    urban: true,
    water: "watch",
    waterNote: "Backwaters and the coast are the water context. No live test is loaded.",
  },
  {
    id: "coimbatore",
    name: "Coimbatore",
    kind: "city",
    state: "Tamil Nadu",
    lat: 11.0168,
    lon: 76.9558,
    census: 2136916,
    areaKm2: 696.25,
    water: "watch",
    waterNote: "The Noyyal is the river context. No live test is loaded.",
  },
  {
    id: "kozhikode",
    name: "Kozhikode",
    kind: "city",
    state: "Kerala",
    lat: 11.2588,
    lon: 75.7804,
    aliases: ["Calicut"],
    census: 2028399,
    urban: true,
    water: "watch",
    waterNote: "The coast and monsoon rain are the water context. No live test is loaded.",
  },
  {
    id: "patna",
    name: "Patna",
    kind: "city",
    state: "Bihar",
    lat: 25.5941,
    lon: 85.1376,
    census: 2049156,
    areaKm2: 142.46,
    water: "watch",
    waterNote: "The Ganga is the river context for Patna. No live test is loaded.",
  },
  {
    id: "bhopal",
    name: "Bhopal",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 23.2599,
    lon: 77.4126,
    census: 1886100,
    areaKm2: 336.06,
    water: "watch",
    waterNote: "The upper lake is the water landmark. No live test is loaded.",
  },
  {
    id: "vadodara",
    name: "Vadodara",
    kind: "city",
    state: "Gujarat",
    lat: 22.3072,
    lon: 73.1812,
    aliases: ["Baroda"],
    census: 1822221,
    urban: true,
    water: "watch",
    waterNote: "The Vishwamitri is the river context. No live test is loaded.",
  },
  {
    id: "agra",
    name: "Agra",
    kind: "city",
    state: "Uttar Pradesh",
    lat: 27.1767,
    lon: 78.0081,
    census: 1585704,
    areaKm2: 120.57,
    water: "watch",
    waterNote: "The Yamuna at Agra is often described as under stress. This is not a tap test.",
  },
  {
    id: "varanasi",
    name: "Varanasi",
    kind: "city",
    state: "Uttar Pradesh",
    lat: 25.3176,
    lon: 82.9739,
    aliases: ["Banaras", "Benares"],
    census: 1432280,
    areaKm2: 118.68,
    water: "watch",
    waterNote: "The Ganga here is both a daily presence and a stressed river. This is not a tap test.",
  },
  {
    id: "ludhiana",
    name: "Ludhiana",
    kind: "city",
    state: "Punjab",
    lat: 30.901,
    lon: 75.8573,
    census: 1613878,
    urban: true,
    water: "watch",
    waterNote: "Groundwater is the usual supply story in this industrial city. No live test is loaded.",
  },
  {
    id: "nashik",
    name: "Nashik",
    kind: "city",
    state: "Maharashtra",
    lat: 19.9975,
    lon: 73.7898,
    census: 1562769,
    urban: true,
    water: "watch",
    waterNote: "The Godavari’s source region is the water context. No live test is loaded.",
  },
  {
    id: "madurai",
    name: "Madurai",
    kind: "city",
    state: "Tamil Nadu",
    lat: 9.9252,
    lon: 78.1198,
    census: 1462420,
    urban: true,
    water: "watch",
    waterNote: "The Vaigai is the local river context. No live test is loaded.",
  },
  {
    id: "thiruvananthapuram",
    name: "Thiruvananthapuram",
    kind: "city",
    state: "Kerala",
    lat: 8.5241,
    lon: 76.9366,
    aliases: ["Trivandrum"],
    census: 1679754,
    areaKm2: 542.57,
    water: "watch",
    waterNote: "Monsoon rain and the coast shape the water here. No live test is loaded.",
  },
  {
    id: "visakhapatnam",
    name: "Visakhapatnam",
    kind: "city",
    state: "Andhra Pradesh",
    lat: 17.6868,
    lon: 83.2185,
    aliases: ["Vizag", "Vishakhapatnam"],
    census: 1728128,
    areaKm2: 513.61,
    water: "watch",
    waterNote: "The coast and city reservoirs are the water context. No live test is loaded.",
  },
  {
    id: "prayagraj",
    name: "Prayagraj",
    kind: "city",
    state: "Uttar Pradesh",
    lat: 25.4358,
    lon: 81.8463,
    aliases: ["Allahabad"],
    census: 1212395,
    areaKm2: 115.46,
    water: "watch",
    waterNote: "The confluence of the Ganga and Yamuna is the water context. No live test is loaded.",
  },
  {
    id: "ranchi",
    name: "Ranchi",
    kind: "city",
    state: "Jharkhand",
    lat: 23.3441,
    lon: 85.3096,
    census: 1126720,
    areaKm2: 197,
    water: "watch",
    waterNote: "Dams and plateau rain are the water context. No live test is loaded.",
  },
  {
    id: "raipur",
    name: "Raipur",
    kind: "city",
    state: "Chhattisgarh",
    lat: 21.2514,
    lon: 81.6296,
    census: 1123558,
    areaKm2: 192.55,
    water: "watch",
    waterNote: "No live water test is loaded for Raipur.",
  },
  {
    id: "amritsar",
    name: "Amritsar",
    kind: "city",
    state: "Punjab",
    lat: 31.634,
    lon: 74.8723,
    census: 1183549,
    areaKm2: 136,
    water: "watch",
    waterNote: "Canal and groundwater supply are the water context. No live test is loaded.",
  },
  {
    id: "jodhpur",
    name: "Jodhpur",
    kind: "city",
    state: "Rajasthan",
    lat: 26.2389,
    lon: 73.0243,
    census: 1033756,
    areaKm2: 75.5,
    water: "watch",
    waterNote: "Dry-season supply is a standing concern. No live test is loaded.",
  },
  {
    id: "guwahati",
    name: "Guwahati",
    kind: "city",
    state: "Assam",
    lat: 26.1445,
    lon: 91.7362,
    census: 962334,
    areaKm2: 219.06,
    water: "watch",
    waterNote: "The Brahmaputra is the water context. No live test is loaded.",
  },
  {
    id: "bhubaneswar",
    name: "Bhubaneswar",
    kind: "city",
    state: "Odisha",
    lat: 20.2961,
    lon: 85.8245,
    census: 885363,
    areaKm2: 135,
    water: "watch",
    waterNote: "Daya and Kuakhai are the nearby river context. No live test is loaded.",
  },
  {
    id: "jammu",
    name: "Jammu",
    kind: "city",
    state: "Jammu and Kashmir",
    lat: 32.7266,
    lon: 74.857,
    census: 576198,
    areaKm2: 159.36,
    water: "watch",
    waterNote: "The Tawi is the river context. No live test is loaded.",
  },
  {
    id: "imphal",
    name: "Imphal",
    kind: "city",
    state: "Manipur",
    lat: 24.817,
    lon: 93.9368,
    census: 517992,
    areaKm2: 121,
    water: "watch",
    waterNote: "Loktak and valley wetlands are the water context. No live test is loaded.",
  },
  {
    id: "agartala",
    name: "Agartala",
    kind: "city",
    state: "Tripura",
    lat: 23.8315,
    lon: 91.2868,
    census: 400004,
    areaKm2: 58.84,
    water: "watch",
    waterNote: "The Howrah river is the local water context. No live test is loaded.",
  },
  {
    id: "shillong",
    name: "Shillong",
    kind: "city",
    state: "Meghalaya",
    lat: 25.5788,
    lon: 91.8933,
    census: 143229,
    areaKm2: 64.36,
    water: "steady",
    waterNote: "Rain and springs are the water story, and this note does not flag a shortage. It is not a lab result.",
  },
  {
    id: "gangtok",
    name: "Gangtok",
    kind: "city",
    state: "Sikkim",
    lat: 27.3389,
    lon: 88.6065,
    census: 100286,
    areaKm2: 19.28,
    water: "steady",
    waterNote: "Springs and rain feed the town, and this note does not flag a shortage. It is not a lab result.",
  },
  {
    id: "port-blair",
    name: "Port Blair",
    kind: "city",
    state: "Andaman and Nicobar Islands",
    lat: 11.6234,
    lon: 92.7265,
    aliases: ["Andaman"],
    census: 108058,
    areaKm2: 17.91,
    water: "watch",
    waterNote: "Island rain and the sea are the water context. No live test is loaded.",
  },
  {
    id: "panaji",
    name: "Panaji",
    kind: "city",
    state: "Goa",
    lat: 15.4909,
    lon: 73.8278,
    aliases: ["Panjim", "Goa"],
    census: 70991,
    areaKm2: 53.7,
    water: "watch",
    waterNote: "The Mandovi and the monsoon are the water context. No live test is loaded.",
  },
  {
    id: "itanagar",
    name: "Itanagar",
    kind: "city",
    state: "Arunachal Pradesh",
    lat: 27.0844,
    lon: 93.6053,
    census: 59490,
    areaKm2: 51.69,
    water: "watch",
    waterNote: "Hill streams are the water context. No live test is loaded.",
  },
  {
    id: "srinagar",
    name: "Srinagar",
    kind: "city",
    state: "Jammu and Kashmir",
    lat: 34.0837,
    lon: 74.7973,
    water: "watch",
    waterNote: "Dal Lake and the Jhelum are the water context. No live test is loaded.",
  },
  {
    id: "dehradun",
    name: "Dehradun",
    kind: "city",
    state: "Uttarakhand",
    lat: 30.3165,
    lon: 78.0322,
    water: "watch",
    waterNote: "Valley streams are the water context. No live test is loaded.",
  },
  {
    id: "chandigarh",
    name: "Chandigarh",
    kind: "city",
    state: "Chandigarh",
    lat: 30.7333,
    lon: 76.7794,
    water: "unknown",
    waterNote: "No water note is loaded for Chandigarh.",
  },
  {
    id: "udaipur",
    name: "Udaipur",
    kind: "city",
    state: "Rajasthan",
    lat: 24.5854,
    lon: 73.7125,
    water: "watch",
    waterNote: "The lakes are famous, and dry months can be tight. This is not a lab result.",
  },
  {
    id: "thane",
    name: "Thane",
    kind: "district",
    state: "Maharashtra",
    lat: 19.2183,
    lon: 72.9781,
    water: "watch",
    waterNote: "Creeks and industrial belts sit beside very dense housing. No live test is loaded.",
  },
  {
    id: "gurugram",
    name: "Gurugram",
    kind: "district",
    state: "Haryana",
    lat: 28.4595,
    lon: 77.0266,
    aliases: ["Gurgaon"],
    water: "watch",
    waterNote: "Groundwater stress is widely discussed here. This is not a tap test.",
  },
  {
    id: "gautam-buddha-nagar",
    name: "Gautam Buddha Nagar",
    kind: "district",
    state: "Uttar Pradesh",
    lat: 28.5355,
    lon: 77.391,
    aliases: ["Noida"],
    water: "watch",
    waterNote: "Groundwater and the Yamuna floodplain are the water context. No live test is loaded.",
  },
  {
    id: "howrah",
    name: "Howrah",
    kind: "district",
    state: "West Bengal",
    lat: 22.5958,
    lon: 88.2636,
    water: "watch",
    waterNote: "The Hooghly is the river context. No live test is loaded.",
  },
  {
    id: "ernakulam",
    name: "Ernakulam",
    kind: "district",
    state: "Kerala",
    lat: 9.9816,
    lon: 76.2999,
    water: "watch",
    waterNote: "Backwaters and heavy rain shape the water here. No live test is loaded.",
  },
  {
    id: "north-24-parganas",
    name: "North 24 Parganas",
    kind: "district",
    state: "West Bengal",
    lat: 22.7228,
    lon: 88.4806,
    aliases: ["Barasat"],
    water: "unknown",
    waterNote: "No water note is loaded for this district.",
  },
  {
    id: "leh",
    name: "Leh",
    kind: "district",
    state: "Ladakh",
    lat: 34.1526,
    lon: 77.5771,
    water: "watch",
    waterNote: "Snowmelt and springs are the supply. No live test is loaded.",
  },
  {
    id: "kutch",
    name: "Kutch",
    kind: "district",
    state: "Gujarat",
    lat: 23.242,
    lon: 69.6669,
    aliases: ["Bhuj", "Kachchh"],
    water: "stressed",
    waterNote: "This district is arid, and water is often scarce. This is not a live measurement.",
  },
  {
    id: "darjeeling",
    name: "Darjeeling",
    kind: "district",
    state: "West Bengal",
    lat: 27.036,
    lon: 88.2627,
    water: "watch",
    waterNote: "Hill springs and monsoon rain are the water context. No live test is loaded.",
  },
  {
    id: "south-goa",
    name: "South Goa",
    kind: "district",
    state: "Goa",
    lat: 15.2736,
    lon: 73.9581,
    aliases: ["Margao"],
    water: "watch",
    waterNote: "The monsoon and the coast define water here. No live test is loaded.",
  },
  {
    id: "wayanad",
    name: "Wayanad",
    kind: "district",
    state: "Kerala",
    lat: 11.6854,
    lon: 76.132,
    water: "watch",
    waterNote: "Forested hills and monsoon rain are the water context. No live test is loaded.",
  },
  ...EXTRA_CITIES.map(extraSeed),
];

export const places: Place[] = SEEDS.map(toPlace);

const seenIds = new Set<string>();
for (const place of places) {
  if (seenIds.has(place.id)) throw new Error(`Duplicate place id: ${place.id}`);
  seenIds.add(place.id);
  if (place.lat < 6 || place.lat > 37 || place.lon < 68 || place.lon > 98) {
    throw new Error(`Place ${place.id} is outside India.`);
  }
}

const byId = new Map(places.map((place) => [place.id, place]));

export function getPlace(id: string | null | undefined): Place | undefined {
  if (!id) return undefined;
  return byId.get(id);
}

export function kindLabel(kind: PlaceKind): string {
  return kind === "city" ? "City" : "District";
}

const STATE_ALIASES: Record<string, string> = {
  "Andhra Pradesh": "andhra",
  "Arunachal Pradesh": "arunachal",
  Assam: "assam",
  Bihar: "bihar",
  Chhattisgarh: "chhattisgarh",
  Goa: "goa",
  Gujarat: "gujarat",
  Haryana: "haryana",
  "Himachal Pradesh": "himachal",
  Jharkhand: "jharkhand",
  Karnataka: "karnataka",
  Kerala: "kerala",
  "Madhya Pradesh": "madhya pradesh",
  Maharashtra: "maharashtra",
  Manipur: "manipur",
  Meghalaya: "meghalaya",
  Mizoram: "mizoram",
  Nagaland: "nagaland",
  Odisha: "odisha orissa",
  Punjab: "punjab",
  Rajasthan: "rajasthan",
  Sikkim: "sikkim",
  "Tamil Nadu": "tamil nadu",
  Telangana: "telangana",
  Tripura: "tripura",
  "Uttar Pradesh": "uttar pradesh",
  Uttarakhand: "uttarakhand",
  "West Bengal": "west bengal",
  Delhi: "ncr",
  "Jammu and Kashmir": "kashmir",
  Ladakh: "ladakh",
  Chandigarh: "chandigarh",
  "Andaman and Nicobar Islands": "andaman nicobar",
  Puducherry: "pondicherry",
  "Dadra and Nagar Haveli and Daman and Diu": "daman diu silvassa dadra",
  Lakshadweep: "lakshadweep",
};

export function filterPlaces(query: string, filter: PlaceFilter): Place[] {
  const q = query.trim().toLowerCase();
  return places
    .filter((place) => {
      if (filter !== "all" && place.kind !== filter) return false;
      if (!q) return true;
      const hay = [place.name, place.state, STATE_ALIASES[place.state] ?? "", place.kind, ...place.aliases]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      if (!q) return a.name.localeCompare(b.name);
      const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStart !== bStart) return aStart - bStart;
      return a.name.localeCompare(b.name);
    });
}

const CITY_PICKS = ["delhi", "mumbai", "bengaluru", "kolkata", "chennai", "jaipur", "kochi", "hyderabad"];
const DISTRICT_PICKS = ["thane", "gurugram", "gautam-buddha-nagar", "ernakulam", "kutch", "leh", "darjeeling", "wayanad"];

export function suggestionPlaces(filter: PlaceFilter): Place[] {
  const ids = filter === "district" ? DISTRICT_PICKS : CITY_PICKS;
  return ids.map((id) => byId.get(id)).filter((place): place is Place => Boolean(place));
}
