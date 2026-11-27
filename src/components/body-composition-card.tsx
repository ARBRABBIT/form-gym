"use client";

import { useState, type CSSProperties } from "react";
import { Plus } from "./icons";
import { Button, Field, Sheet } from "./ui";
import { TODAY, formatDate } from "@/lib/model";
import {
  compositionError,
  latestCompositionScan,
  sampleCompositionScans,
  type BodyCompositionScan,
} from "@/lib/body-composition";
import type { ScreenProps } from "./journal-app";

const value = (number: number | null | undefined, digits = 1) =>
  number == null
    ? "—"
    : number.toLocaleString("en-IN", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
const sourceLabel = (scan: BodyCompositionScan) =>
  scan.source === "sample"
    ? "Sample scan"
    : scan.source === "manual"
      ? "Manual entry"
      : scan.deviceModel || "InBody scan";

export default function BodyCompositionCard({
  data,
  update,
  date,
  persistent = false,
}: Pick<ScreenProps, "data" | "update" | "date" | "persistent">) {
  const scans = [
    ...(data.sampleData ? sampleCompositionScans() : []),
    ...(data.bodyCompositionScans ?? []),
  ];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const available = scans
    .filter((item) => item.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date));
  const scan =
    available.find((item) => item.id === selectedId) ||
    latestCompositionScan(scans, date);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"details" | "record" | null>(null);
  const [draft, setDraft] = useState({
    date,
    weight: "",
    fat: "",
    muscle: "",
    water: "",
    bmr: "",
  });
  const [error, setError] = useState("");
  const edit = () => {
    if (!scan) return;
    setEditingId(scan.source === "sample" ? null : scan.id);
    setDraft({
      date: scan.date,
      weight: String(scan.weightKg),
      fat: String(scan.bodyFatPercent),
      water:
        scan.totalBodyWaterLitres == null
          ? ""
          : String(scan.totalBodyWaterLitres),
      bmr:
        scan.basalMetabolicRateKcal == null
          ? ""
          : String(scan.basalMetabolicRateKcal),
      muscle:
        scan.skeletalMuscleMassKg == null
          ? ""
          : String(scan.skeletalMuscleMassKg),
    });
    setError("");
    setDialog("record");
  };
  const record = () => {
    setEditingId(null);
    setDraft({ date, weight: "", fat: "", muscle: "", water: "", bmr: "" });
    setError("");
    setDialog("record");
  };
  const fatMass = scan ? (scan.weightKg * scan.bodyFatPercent) / 100 : null;
  const leanMass = scan
    ? scan.weightKg * (1 - scan.bodyFatPercent / 100)
    : null;
  const reading = (
    label: string,
    number: number | null | undefined,
    unit: string,
    digits = 1,
  ) => (
    <div>
      <dt>{label}</dt>
      <dd>
        <span className="composition-digits">{value(number, digits)}</span>
        {number != null && <small>{unit}</small>}
      </dd>
    </div>
  );

  return (
    <>
      <article
        className="body-composition-card"
        aria-label="Body composition"
        data-nav-tone="dark"
      >
        <header>
          <h3>Body composition</h3>
          {scan && (
            <div className="composition-scan-date">
              <span>Last scan</span>
              <time dateTime={scan.date}>
                {formatDate(scan.date, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
            </div>
          )}
        </header>
        {scan ? (
          <>
            <button
              type="button"
              className="composition-card-trigger"
              aria-label="View body composition"
              aria-haspopup="dialog"
              onClick={() => setDialog("details")}
            />
            <div
              className="composition-distribution"
              role="img"
              aria-label={`Estimated body composition: ${value(scan.bodyFatPercent)} percent fat and ${value(100 - scan.bodyFatPercent)} percent fat-free mass`}
              style={
                {
                  "--composition-fat": `${scan.bodyFatPercent}%`,
                } as CSSProperties
              }
            >
              <div className="composition-meter-track" aria-hidden="true">
                <span />
              </div>
            </div>
            <div className="composition-overview">
              <div className="composition-primary">
                <span>Body fat</span>
                <p>
                  <strong className="composition-digits">
                    {value(scan.bodyFatPercent)}
                  </strong>
                  <small>%</small>
                </p>
              </div>
              <dl className="composition-secondary">
                {reading("Weight", scan.weightKg, "kg")}
                {reading("Skeletal muscle", scan.skeletalMuscleMassKg, "kg")}
              </dl>
            </div>
          </>
        ) : (
          <div className="composition-empty">
            <p>Your body composition, over time.</p>
            <span>
              No scan recorded for this date yet. Add values from your report to
              see weight, body fat and skeletal muscle together.
            </span>
            <Button variant="secondary" onClick={record}>
              <Plus size={15} /> Record a scan
            </Button>
          </div>
        )}
      </article>

      {dialog && (
        <Sheet
          title={
            dialog === "record" ? "Record body composition" : "Body composition"
          }
          className="composition-sheet"
          onClose={() => setDialog(null)}
        >
          {dialog === "details" && scan ? (
            <>
              {available.length > 1 && (
                <label className="field">
                  <span>Scan history</span>
                  <select
                    aria-label="Scan history"
                    value={scan.id}
                    onChange={(event) => setSelectedId(event.target.value)}
                  >
                    {available.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.date} · {sourceLabel(item)} · {item.weightKg} kg
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p className="composition-sheet-source">
                {sourceLabel(scan)} ·{" "}
                {formatDate(scan.date, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <dl className="composition-detail-readings">
                {reading("Body fat", scan.bodyFatPercent, "%")}
                {reading("Weight", scan.weightKg, "kg")}
                {reading("Skeletal muscle", scan.skeletalMuscleMassKg, "kg")}
                {reading("Fat mass", fatMass, "kg")}
                {reading("Fat-free mass", leanMass, "kg")}
                {scan.totalBodyWaterLitres != null &&
                  reading("Total body water", scan.totalBodyWaterLitres, "L")}
                {scan.basalMetabolicRateKcal != null &&
                  reading(
                    "Basal metabolic rate",
                    scan.basalMetabolicRateKcal,
                    "kcal/day",
                    0,
                  )}
              </dl>
              <p className="composition-note">
                Fat and fat-free mass are calculated from the scan’s weight and
                body fat percentage. Body water describes composition, separate
                from your water intake.
              </p>
              {scan.source === "sample" && (
                <p className="composition-note">
                  Illustrative sample values. InBody is not connected.
                </p>
              )}
              <div className="trainer-actions">
                <Button onClick={edit}>Edit scan values</Button>
                <Button variant="secondary" onClick={record}>
                  <Plus size={16} /> Record a scan
                </Button>
              </div>
            </>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const weightKg = Number(draft.weight),
                  bodyFatPercent = Number(draft.fat),
                  skeletalMuscleMassKg = draft.muscle.trim()
                    ? Number(draft.muscle)
                    : null;
                if (
                  (draft.water.trim() &&
                    (!Number.isFinite(Number(draft.water)) ||
                      Number(draft.water) < 0)) ||
                  (draft.bmr.trim() &&
                    (!Number.isFinite(Number(draft.bmr)) ||
                      Number(draft.bmr) <= 0))
                ) {
                  setError("Check the body water and metabolic rate values.");
                  return;
                }
                const problem = compositionError(
                  weightKg,
                  bodyFatPercent,
                  skeletalMuscleMassKg,
                );
                if (problem) {
                  setError(problem);
                  return;
                }
                if (!draft.date || draft.date > TODAY) {
                  setError("Choose a scan date up to today.");
                  return;
                }
                const original = editingId
                  ? data.bodyCompositionScans?.find(
                      (item) => item.id === editingId,
                    )
                  : undefined;
                const entry: BodyCompositionScan = {
                  ...original,
                  id: editingId || crypto.randomUUID(),
                  date: draft.date,
                  source: "manual",
                  weightKg,
                  bodyFatPercent,
                  skeletalMuscleMassKg,
                  totalBodyWaterLitres: draft.water.trim()
                    ? Number(draft.water)
                    : null,
                  basalMetabolicRateKcal: draft.bmr.trim()
                    ? Number(draft.bmr)
                    : null,
                };
                update(
                  (store) => ({
                    ...store,
                    bodyCompositionScans: [
                      ...(store.bodyCompositionScans ?? []).filter(
                        (item) => item.id !== editingId,
                      ),
                      entry,
                    ],
                  }),
                  "Body composition updated",
                );
                setDialog(null);
              }}
            >
              <p className="composition-note">
                Copy the values from your body composition report. These will be
                labelled as a manual entry.
              </p>
              <Field
                label="Scan date"
                type="date"
                required
                max={TODAY}
                value={draft.date}
                onChange={(date) =>
                  setDraft((current) => ({ ...current, date }))
                }
              />
              <div className="form-grid">
                <Field
                  label="Weight (kg)"
                  type="number"
                  required
                  min="0.1"
                  max="700"
                  step="0.1"
                  value={draft.weight}
                  onChange={(weight) =>
                    setDraft((current) => ({ ...current, weight }))
                  }
                />
                <Field
                  label="Body fat (%)"
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={draft.fat}
                  onChange={(fat) =>
                    setDraft((current) => ({ ...current, fat }))
                  }
                />
              </div>
              <Field
                label="Skeletal muscle mass (kg)"
                type="number"
                min="0"
                max="700"
                step="0.1"
                value={draft.muscle}
                onChange={(muscle) =>
                  setDraft((current) => ({ ...current, muscle }))
                }
              />
              <div className="form-grid">
                <Field
                  label="Total body water (L)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={draft.water}
                  onChange={(water) =>
                    setDraft((current) => ({ ...current, water }))
                  }
                />
                <Field
                  label="Basal metabolic rate (kcal/day)"
                  type="number"
                  min="1"
                  step="1"
                  value={draft.bmr}
                  onChange={(bmr) =>
                    setDraft((current) => ({ ...current, bmr }))
                  }
                />
              </div>
              <p className="composition-note">
                Muscle, water and metabolic rate are optional. Leave it blank if
                your report doesn’t provide it.{" "}
                {persistent
                  ? "Entries are saved to the shared journal."
                  : "Entries are kept for this session."}
              </p>
              {error && <p role="alert">{error}</p>}
              <div className="form-actions">
                <Button variant="secondary" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save scan</Button>
              </div>
            </form>
          )}
        </Sheet>
      )}
    </>
  );
}
