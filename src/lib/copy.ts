import { average, bandFrom, BAND_LABEL, trendOf, type AirReading, type Trend } from "@/lib/air";
import { istHour } from "@/lib/format";
import type { Place } from "@/lib/places";

export function trendLine(trend: Trend): string {
  if (trend === "rising") return "Short trend: rising over the last few hours.";
  if (trend === "easing") return "Short trend: easing over the last few hours.";
  if (trend === "steady") return "Short trend: fairly steady over the last few hours.";
  return "Short trend: not enough hours yet.";
}

export function rangeLine(reading: AirReading | undefined): string | null {
  if (!reading || reading.history.length < 2) return null;
  const values = reading.history.map((point) => point.aqi);
  const low = Math.min(...values);
  const high = Math.max(...values);
  return `In this window the number ran from ${low} to ${high}.`;
}

export function airMeaning(reading: AirReading | undefined): string {
  if (!reading) {
    return "No air reading yet, so there isn’t a plain-language read on being outside.";
  }
  const trend = trendOf(reading.history.map((point) => point.aqi));
  const base = {
    good: "Air is in the good band. Most people can be outside as usual.",
    moderate:
      "Air is moderate. It is fine for most people, though anyone sensitive to air may want easier outdoor time.",
    poor: "Air is poor. Long or heavy time outside is a strain, especially for children, older people, and anyone with breathing trouble.",
    severe: "Air is severe. Staying indoors with the windows shut is the safer default until this eases.",
  }[reading.band];
  if (trend === "unclear") return base;
  if (trend === "rising") return `${base} The last few hours were rising.`;
  if (trend === "easing") return `${base} The last few hours were easing.`;
  return `${base} The last few hours were fairly steady.`;
}

export function waterMeaning(place: Place): string {
  if (place.water.status === "unknown") {
    return "There isn’t a water note, so a blank here does not mean everything is fine.";
  }
  if (place.water.status === "stressed") {
    return "The water note is a warning about the area, not a result for your kitchen tap.";
  }
  if (place.water.status === "steady") {
    return "The water note does not flag a shortage, and it is still not a lab result.";
  }
  return "The water note is general context, not a test of your tap.";
}

export function peopleMeaning(place: Place): string {
  if (!place.population) {
    return "No population figure is loaded, and nothing earlier is saved for this count.";
  }
  const label = place.population.label.charAt(0).toUpperCase() + place.population.label.slice(1);
  const scope = place.population.scope.replace(", rounded", "");
  const density = place.population.comparison
    ? ` ${place.population.comparison}`
    : " Density isn’t shown, because the boundary for this count isn’t loaded.";
  return `${label} people in the ${scope}. That is ${place.population.share}.${density}`;
}

export function buildOutlook(place: Place, reading: AirReading | undefined): string[] {
  const name = place.name;
  const lines: string[] = [];

  if (reading && reading.forecast.length >= 3) {
    const avg = Math.round(average(reading.forecast.map((point) => point.aqi)));
    const band = BAND_LABEL[bandFrom(avg)].toLowerCase();
    lines.push(
      `The air model points to a ${band} stretch ahead in ${name}, around ${avg} on the US AQI scale, and that is only an estimate.`,
    );
  } else {
    lines.push(`No forward air estimate is loaded for ${name} yet.`);
  }

  if (reading && reading.history.length >= 8) {
    const trend = trendOf(reading.history.map((point) => point.aqi));
    if (trend === "rising") {
      lines.push(`Over the last several hours in this reading, the air number in ${name} was rising.`);
    } else if (trend === "easing") {
      lines.push(`Over the last several hours in this reading, the air number in ${name} was easing.`);
    } else {
      lines.push(`Over the last several hours in this reading, the air number in ${name} held fairly steady.`);
    }
  } else {
    lines.push(`There is not enough recent air history in ${name} to describe a short trend.`);
  }

  if (reading && reading.forecast.length >= 6) {
    const morning = reading.forecast.filter((point) => {
      const hour = istHour(point.t);
      return hour >= 5 && hour <= 9;
    });
    const afternoon = reading.forecast.filter((point) => {
      const hour = istHour(point.t);
      return hour >= 13 && hour <= 17;
    });
    if (morning.length && afternoon.length) {
      const delta = average(afternoon.map((point) => point.aqi)) - average(morning.map((point) => point.aqi));
      if (delta >= 15) {
        lines.push(
          `The model has higher afternoon hours than mornings in ${name}, which is a hint rather than a timetable.`,
        );
      } else if (delta <= -15) {
        lines.push(
          `The model has higher morning hours than afternoons in ${name}, which is a hint rather than a timetable.`,
        );
      } else {
        lines.push(`The model does not show a strong morning-to-afternoon swing in ${name}, and that can change.`);
      }
    } else {
      lines.push(`A time-of-day pattern is not clear in the hours loaded for ${name}.`);
    }
  } else {
    lines.push(`A time-of-day pattern is not available until more model hours load for ${name}.`);
  }

  if (place.water.status === "unknown") {
    lines.push(`There is no water forecast for ${name}, and no standing note to lean on either.`);
  } else {
    lines.push(
      `There is no water forecast, so the standing note for ${name} stays “${place.water.label},” as context and not a prediction.`,
    );
  }

  if (place.population) {
    lines.push(
      `Headcount will not swing tomorrow, and ${place.population.label} remains a 2011 census backdrop rather than a forecast.`,
    );
  } else {
    lines.push(`No population outlook is possible, because a census figure for ${name} is not loaded.`);
  }

  return lines.slice(0, 5);
}
