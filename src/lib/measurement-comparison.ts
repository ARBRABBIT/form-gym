import type { Store } from "./model";

export function previousMeasurementMonth(month: string) {
  const [year, number] = month.split("-").map(Number);
  return `${number === 1 ? year - 1 : year}-${String(number === 1 ? 12 : number - 1).padStart(2, "0")}`;
}

export function measurementUnit(name: string) {
  return name === "Weight" ? "kg" : name === "Body Fat %" ? "%" : "cm";
}

// Whitespace and missing records must never turn into a zero measurement.
export function measurementChange(current?: string, previous?: string) {
  if (!current?.trim() || !previous?.trim()) return null;
  const now = Number(current), then = Number(previous);
  if (!Number.isFinite(now) || !Number.isFinite(then)) return null;
  const change = Math.round((now - then) * 100) / 100;
  return `${change > 0 ? "+" : ""}${change}`;
}

export function baselineValue(data: Store, name: string) {
  return data.baselineMeasurements?.[name] ?? (name === "Weight" ? data.profile["Starting weight (kg)"] || "" : "");
}
