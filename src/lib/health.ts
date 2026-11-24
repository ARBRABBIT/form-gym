export type HealthMetrics = {
  date: string;
  connected: boolean;
  configured: boolean;
  fetchedAt?: string;
  recovery: number | null;
  hrv: number | null;
  restingHeartRate: number | null;
  spo2: number | null;
  skinTemperature: number | null;
  respiratoryRate: number | null;
  sleepHours: number | null;
  sleepPerformance: number | null;
  strain: number | null;
  steps: number | null;
  energyKcal: number | null;
  workoutCount: number | null;
  workoutMinutes: number | null;
};
export const emptyHealth = (
  date: string,
  configured = false,
  connected = false,
): HealthMetrics => ({
  date,
  configured,
  connected,
  recovery: null,
  hrv: null,
  restingHeartRate: null,
  spo2: null,
  skinTemperature: null,
  respiratoryRate: null,
  sleepHours: null,
  sleepPerformance: null,
  strain: null,
  steps: null,
  energyKcal: null,
  workoutCount: null,
  workoutMinutes: null,
});
export function scaleReading(
  text: string,
): { weight: number; unit: "kg" | "lb" | null } | null {
  const explicit = [
    ...text.matchAll(
      /(?<![\d.])(\d{1,3}(?:[.,]\d{1,2})?)\s*(kg|kgs|lb|lbs)\b/gi,
    ),
  ].map((match) => ({
    weight: Number(match[1].replace(",", ".")),
    unit: match[2].toLowerCase().startsWith("k")
      ? ("kg" as const)
      : ("lb" as const),
  }));
  const readings = explicit.length
    ? explicit
    : text
        .split(/\n/)
        .map((line) => line.trim())
        .filter((line) => /^\d{1,3}(?:[.,]\d{1,2})?$/.test(line))
        .map((line) => ({
          weight: Number(line.replace(",", ".")),
          unit: null,
        }));
  const valid = readings.filter(
    (reading) =>
      reading.weight > 0 &&
      reading.weight <= (reading.unit === "lb" ? 1543 : 700),
  );
  const unique = [
    ...new Map(
      valid.map((value) => [`${value.weight}:${value.unit}`, value]),
    ).values(),
  ];
  return unique.length === 1 ? unique[0] : null;
}

/** Illustrative values used only in the explicitly labeled sample journal. */
export function sampleHealth(date: string): HealthMetrics {
  const variation = Number(date.slice(-2)) % 4;
  return { ...emptyHealth(date), recovery: 78 + variation, hrv: 62.4 + variation, restingHeartRate: 56 + variation, spo2: 97.2, skinTemperature: 33.4, respiratoryRate: 15.2, sleepHours: 7.6, sleepPerformance: 91, strain: 10.4, steps: 8640 + variation * 120, energyKcal: 2180, workoutCount: 1, workoutMinutes: 55 };
}
