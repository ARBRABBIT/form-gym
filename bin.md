# Feature bin

## Stool tracking - parked 24 November 2026

Removed from the active app at the user's request. This archive preserves the pre-removal implementation for future reference. It contains source code and test snapshots, not user health records or credentials.

### Scope and behavior

- Gut home card: 0% / 100% indicated whether a manual check-in existed on the selected date; it was not a gut-health score.
- Gut details: daily bowel-movement count, latest Bristol type and comfort.
- Check-in: date, time, Bristol type 1-7, comfortable/strained/urgent, optional notes.
- Model: optional stools array of StoolEntry objects. Current app state was memory-only; do not reintroduce browser persistence from obsolete tests.
- GET /api/health/stool: unconfigured PoopCheck status placeholder only; no live analysis.
- WHOOP does not provide stool tracking. The proposed PoopCheck photo flow requires business API access, documentation and confirmation of availability/terms before integration. It is separate from sync of an existing provider's history.
- Other researched options: Throne (automatic capture, CSV export; US restrictions; public live API unverified), Kohler Dekoda (automatic capture in its own app; public API and India support unverified), Bowelle (manual logging with Premium CSV export).
- Sources: https://poopcheck.app/business/api/ ; https://thronescience.com/ ; https://www.kohlerhealth.com/how-it-works/ ; https://bowelle.com/faq/ . Recheck vendor details before restoring.

### Restoration guide

Restore only the feature-specific pieces from the snapshots below, rather than overwriting whole files and losing later changes. Restore StoolEntry and Store.stools, bristolTypes, StoolCheckIn, overview bindings/card/detail/modal, allowed health section, API placeholder and relevant CSS. Reintroduce current tests for the feature. Historical health.spec.ts includes superseded localStorage persistence assumptions and must be adapted, not copied blindly.

The active app now has three WHOOP health cards. Obsolete health detail URLs fall back to home. Existing weight check-ins and reminders are separate features.

### Original file snapshots

These are archival code blocks, not imported or executed by the app.

#### src/components/health-checkins.tsx

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, Camera, Check, ImagePlus, RotateCcw } from "lucide-react";
import { Button, Field, Sheet, TextArea } from "./ui";
import DatePicker from "./date-picker";
import { dateKey, uid } from "@/lib/model";
import { bristolTypes } from "@/lib/health";
import type { ScreenProps } from "./journal-app";

function useLocalPhoto() {
  const [photo, setPhoto] = useState<File | null>(null),
    [url, setUrl] = useState("");
  useEffect(() => {
    if (!photo) {
      setUrl("");
      return;
    }
    const value = URL.createObjectURL(photo);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [photo]);
  return { photo, url, setPhoto };
}
const errorText = "Please choose a JPG, PNG or WebP photo under 5 MB.";
export function MorningCheckIn({
  data,
  update,
  onClose,
}: Pick<ScreenProps, "data" | "update"> & { onClose: () => void }) {
  const [date, setDate] = useState(dateKey()),
    [weight, setWeight] = useState(""),
    [unit, setUnit] = useState("kg"),
    [notes, setNotes] = useState(""),
    [afterBathroom, setAfterBathroom] = useState(false),
    [consent, setConsent] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [source, setSource] = useState<"photo" | "manual">("manual");
  const { photo, url, setPhoto } = useLocalPhoto();
  const input = useRef<HTMLInputElement>(null);
  const readingRequest = useRef<AbortController | null>(null);
  useEffect(() => () => readingRequest.current?.abort(), []);
  const read = async () => {
    if (!photo) return;
    setBusy(true);
    setMessage("");
    readingRequest.current?.abort();
    const controller = new AbortController();
    readingRequest.current = controller;
    try {
      if (!consent) {
        setMessage("Starting on-device reading… Your photo stays here.");
        const { readScaleOnDevice } = await import("@/lib/scale-reader");
        const reading = await readScaleOnDevice(
          photo,
          controller.signal,
          setMessage,
        );
        if (!reading) {
          setMessage(
            "We couldn’t read one clear weight. Retake a close-up of the display, enter it manually, or try optional cloud reading.",
          );
          return;
        }
        setWeight(String(reading.weight));
        setUnit(reading.unit === "lb" ? "lb" : "kg");
        setSource("photo");
        setConfirmed(false);
        setMessage(
          reading.unit
            ? "Reading found on your device. Please check the number and unit before sending."
            : "Number found on your device. Please confirm the unit and reading.",
        );
        return;
      }
      const form = new FormData();
      form.set("photo", photo);
      const response = await fetch("/api/health/scale", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(
          body.message ||
            "We couldn’t read the display. Try another photo or enter your weight.",
        );
        return;
      }
      if (
        !Number.isFinite(body.weight) ||
        body.weight <= 0 ||
        body.weight > 1543
      )
        throw new Error();
      setWeight(String(body.weight));
      setUnit(body.unit === "lb" ? "lb" : "kg");
      setSource("photo");
      setConfirmed(false);
      setMessage(
        body.unit
          ? "Reading found. Please check the number and unit before sending."
          : "Number found. The unit wasn’t clear — please choose kg or lb and check the reading.",
      );
    } catch {
      setMessage(
        "Photo reading is unavailable. You can still enter your weight manually.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Morning check-in" onClose={onClose}>
      <div className="health-sheet">
        <p className="health-intro">
          Step, snap, done. One number, zero judgement.
        </p>
        <p className="helper">
          Use the same scale and similar morning conditions. No bathroom visit
          yet? That’s okay.
        </p>
        <div className="scale-photo-area">
          {url ? (
            <img src={url} alt="Your scale display for review" />
          ) : (
            <div>
              <Camera size={30} />
              <strong>A quick scale selfie</strong>
              <span>Keep the display clear and the camera steady.</span>
            </div>
          )}
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            aria-label="Scale photo"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (
                !file.type.match(/^image\/(jpeg|png|webp)$/) ||
                file.size > 5 * 1024 * 1024
              ) {
                setMessage(errorText);
                e.target.value = "";
                return;
              }
              setPhoto(file);
              setMessage("");
              setSource("manual");
              setConfirmed(false);
            }}
          />
          <Button variant="secondary" onClick={() => input.current?.click()}>
            {photo ? <RotateCcw size={16} /> : <ImagePlus size={16} />}
            {photo ? "Retake / choose another" : "Take or upload photo"}
          </Button>
        </div>
        <p className="helper">
          On-device reading is free and keeps the photo here. Your journal saves
          only the confirmed number.
        </p>
        {photo && (
          <>
            <label className="health-checkbox">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                Allow this photo to be sent for optional cloud text reading.
                Leave unchecked to read on this device.
              </span>
            </label>
            <Button variant="secondary" disabled={busy} onClick={read}>
              {busy ? "Reading the scale…" : "Read weight from photo"}
            </Button>
          </>
        )}
        {message && (
          <p className="health-message" role="status">
            {message}
          </p>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const value = Number(weight),
              kg = unit === "lb" ? value * 0.45359237 : value;
            if (
              !Number.isFinite(kg) ||
              kg < 1 ||
              kg > 700 ||
              !confirmed ||
              !date ||
              date > dateKey()
            ) {
              setMessage(
                "Check the weight, unit and date, then confirm your reading.",
              );
              return;
            }
            const previous = [...data.weights]
              .reverse()
              .filter((entry) => entry.date < date)
              .sort((a, b) => b.date.localeCompare(a.date))
              .find((entry) => Number(entry.weight) > 0);
            const difference = previous ? kg - Number(previous.weight) : 0;
            update(
              (s) => ({
                ...s,
                weights: [
                  ...s.weights,
                  {
                    id: uid(),
                    date,
                    weight: kg.toFixed(1),
                    gain: difference > 0 ? difference.toFixed(1) : "",
                    loss: difference < 0 ? Math.abs(difference).toFixed(1) : "",
                    notes: notes.trim(),
                    source,
                    afterBathroom,
                  },
                ],
              }),
              "Morning weight saved. A little more of your story.",
            );
            // A backdated entry must not suppress today's reminder.
            if (date === dateKey()) {
              fetch("/api/reminders/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "check-in" }),
              }).catch(() => {});
              navigator.serviceWorker
                ?.getRegistration()
                .then((registration) =>
                  registration?.getNotifications({
                    tag: "form-morning-weight",
                  }),
                )
                .then((notifications) =>
                  notifications?.forEach((notification) =>
                    notification.close(),
                  ),
                )
                .catch(() => {});
            }
            onClose();
          }}
        >
          <div className="health-entry-date">
            <span>Date</span>
            <DatePicker
              label="Weigh-in date"
              value={date}
              onChange={setDate}
              showValue
            />
          </div>
          <div className="health-form-pair">
            <Field
              label="Scale reading"
              type="number"
              min="1"
              max={unit === "lb" ? "1543" : "700"}
              required
              value={weight}
              onChange={(v) => {
                setWeight(v);
                setConfirmed(false);
              }}
              placeholder="e.g. 72.5"
            />
            <label className="field">
              <span>Unit</span>
              <select
                aria-label="Weight unit"
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  setConfirmed(false);
                }}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="lb">Pounds (lb)</option>
              </select>
            </label>
          </div>
          <label className="health-checkbox">
            <input
              type="checkbox"
              checked={afterBathroom}
              onChange={(e) => setAfterBathroom(e.target.checked)}
            />
            <span>After using the bathroom · optional</span>
          </label>
          <TextArea
            label="Morning notes · optional"
            value={notes}
            onChange={setNotes}
            placeholder="Anything you’d like to remember?"
          />
          <label className="health-checkbox">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>I checked the weight and unit.</span>
          </label>
          <p className="helper">
            Gain / loss is calculated from your previous dated weight entry.
            Photos aren’t saved to your journal.
          </p>
          <Button type="submit" disabled={busy} className="full-width">
            Send check-in <Check size={17} />
          </Button>
        </form>
      </div>
    </Sheet>
  );
}

export function StoolCheckIn({
  update,
  onClose,
}: Pick<ScreenProps, "update"> & { onClose: () => void }) {
  const [date, setDate] = useState(dateKey()),
    [time, setTime] = useState(new Date().toTimeString().slice(0, 5)),
    [type, setType] = useState(0),
    [comfort, setComfort] = useState("comfortable"),
    [notes, setNotes] = useState(""),
    [message, setMessage] = useState("");
  return (
    <Sheet title="Gut check-in" onClose={onClose}>
      <div className="health-sheet">
        <p className="health-intro">
          A little less awkward. A little more insight.
        </p>
        <p className="helper">
          A personal log of stool form and comfort. Separate from WHOOP.
        </p>
        <div className="health-message">
          Photo analysis isn’t connected yet. Your photos won’t be uploaded.
          Choose the closest Bristol type below.
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!type || !date || date > dateKey()) {
              setMessage("Choose the closest stool type and a valid date.");
              return;
            }
            update(
              (s) => ({
                ...s,
                stools: [
                  ...(s.stools || []),
                  { id: uid(), date, time, type, comfort, notes: notes.trim() },
                ],
              }),
              "Gut check-in saved.",
            );
            onClose();
          }}
        >
          <div className="health-form-pair">
            <div className="health-entry-date">
              <span>Date</span>
              <DatePicker
                value={date}
                onChange={setDate}
                showValue
                label="Stool entry date"
              />
            </div>
            <Field
              label="Time"
              type="time"
              required
              value={time}
              onChange={setTime}
            />
          </div>
          <fieldset className="bristol-options">
            <legend>Which looks closest?</legend>
            {bristolTypes.map((item) => (
              <label
                key={item.type}
                className={type === item.type ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="bristol-type"
                  value={item.type}
                  checked={type === item.type}
                  onChange={() => setType(item.type)}
                />
                <span className="bristol-number">{item.type}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="field">
            <span>How did it feel?</span>
            <select
              aria-label="Bowel comfort"
              value={comfort}
              onChange={(e) => setComfort(e.target.value)}
            >
              <option value="comfortable">Comfortable</option>
              <option value="strained">Strained</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <TextArea
            label="Gut notes · optional"
            value={notes}
            onChange={setNotes}
            placeholder="Any context you want to remember?"
          />
          <p className="helper">
            These entries describe your experience; they don’t diagnose gut
            health.
          </p>
          {message && <p role="alert">{message}</p>}
          <Button className="full-width" type="submit">
            Save gut check-in <Check size={17} />
          </Button>
        </form>
      </div>
    </Sheet>
  );
}

type ReminderSettings = {
  enabled: boolean;
  time: string;
  timezone: string;
  tone: string;
  publicKey: string;
  workerActive?: boolean;
};
export function MorningReminders({
  onClose,
  loggedToday = false,
}: {
  onClose: () => void;
  loggedToday?: boolean;
}) {
  const [settings, setSettings] = useState<ReminderSettings>({
      enabled: false,
      time: "07:30",
      timezone: "Asia/Kolkata",
      tone: "friendly",
      publicKey: "",
    }),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/reminders", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setSettings)
      .catch(() =>
        setMessage("Reminder settings are unavailable. Please try again."),
      );
  }, []);
  const enable = async () => {
    if (
      !window.isSecureContext ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setMessage(
        "Notifications need HTTPS and a supported browser. On iPhone, add Form to your Home Screen first.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage(
          "Notifications are off. You can allow them in browser settings, or check in whenever you like.",
        );
        return;
      }
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const padded = settings.publicKey.replace(/-/g, "+").replace(/_/g, "/");
      const key = Uint8Array.from(
        atob(padded + "=".repeat((4 - (padded.length % 4)) % 4)),
        (char) => char.charCodeAt(0),
      );
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }));
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          checkedInToday: loggedToday,
          subscription: subscription.toJSON(),
        }),
      });
      if (!response.ok) throw new Error();
      setSettings((s) => ({ ...s, enabled: true }));
      setMessage(
        settings.workerActive
          ? "Your daily reminder is saved. You can snooze or skip any day."
          : "Your preference is saved. Delivery is currently paused; reminders will start when the service is available.",
      );
    } catch {
      setMessage(
        "We couldn’t enable reminders. On iPhone, open Form from your Home Screen and try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const action = async (action: "skip" | "snooze") => {
    const response = await fetch("/api/reminders/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) throw new Error();
    const result = await response.json();
    if (!result.saved) {
      setMessage(result.message || "No active reminder to change.");
      return;
    }
    setMessage(
      action === "skip"
        ? "No reminder for the rest of today. See you tomorrow."
        : "All right. We’ll nudge you in 30 minutes.",
    );
  };
  return (
    <Sheet title="Your morning nudge" onClose={onClose}>
      <div className="health-sheet">
        <Bell size={28} />
        <p className="health-intro">A friendly reminder. Always your choice.</p>
        <Field
          label="Remind me at"
          type="time"
          required
          value={settings.time}
          onChange={(time) => setSettings((s) => ({ ...s, time }))}
        />
        <label className="field">
          <span>Time zone</span>
          <select
            aria-label="Reminder time zone"
            value={settings.timezone}
            onChange={(e) =>
              setSettings((s) => ({ ...s, timezone: e.target.value }))
            }
          >
            {[
              ...new Set([
                "Asia/Kolkata",
                Intl.DateTimeFormat().resolvedOptions().timeZone,
                "UTC",
              ]),
            ].map((zone) => (
              <option key={zone} value={zone}>
                {zone === "Asia/Kolkata" ? "India · IST (Asia/Kolkata)" : zone}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="reminder-tone">
          <legend>Choose the mood</legend>
          <label>
            <input
              type="radio"
              name="reminder-tone"
              checked={settings.tone === "friendly"}
              onChange={() => setSettings((s) => ({ ...s, tone: "friendly" }))}
            />
            Friendly & discreet
          </label>
          <label>
            <input
              type="radio"
              name="reminder-tone"
              checked={settings.tone === "playful"}
              onChange={() => setSettings((s) => ({ ...s, tone: "playful" }))}
            />
            A little bathroom humour
          </label>
        </fieldset>
        <div className="reminder-preview">
          <strong>Form · Morning check-in</strong>
          <p>
            {settings.tone === "playful"
              ? "Bathroom business done? Scale selfie next."
              : "Morning mission: step, snap, done."}
          </p>
        </div>
        <p className="helper">
          Shown on your lock screen. Reminders stop for the day after today’s
          weight is sent. Delivery can be delayed by device settings or
          connectivity.
        </p>
        {message && (
          <p className="health-message" role="status">
            {message}
          </p>
        )}
        <Button
          className="full-width"
          disabled={
            busy ||
            !settings.publicKey ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.time)
          }
          onClick={enable}
        >
          {busy
            ? "Setting up…"
            : settings.enabled
              ? "Save reminder changes"
              : "Enable daily reminder"}
        </Button>
        {settings.enabled && (
          <>
            <div className="health-inline-actions">
              <Button
                variant="ghost"
                onClick={() =>
                  action("snooze").catch(() =>
                    setMessage("Couldn’t snooze. Please try again."),
                  )
                }
              >
                In 30 minutes
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  action("skip").catch(() =>
                    setMessage("Couldn’t skip. Please try again."),
                  )
                }
              >
                Skip today
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  const response = await fetch("/api/reminders", {
                    method: "DELETE",
                  });
                  if (!response.ok) throw new Error();
                  await (
                    await navigator.serviceWorker.getRegistration()
                  )?.pushManager
                    .getSubscription()
                    .then((subscription) => subscription?.unsubscribe());
                  setSettings((s) => ({ ...s, enabled: false }));
                  setMessage("Reminders turned off.");
                } catch {
                  setMessage("Couldn’t turn off reminders. Please try again.");
                }
              }}
            >
              Turn off reminders
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}

```

#### src/components/health-overview.tsx

```tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  Droplet,
  Leaf,
  RefreshCw,
  Scale,
  Watch,
  Wind,
} from "lucide-react";
import { emptyHealth, type HealthMetrics } from "@/lib/health";
import { dateKey, formatDate } from "@/lib/model";
import type { ScreenProps } from "./journal-app";
import { Button, Sheet } from "./ui";
import DatePicker from "./date-picker";
import WearableConnect from "./wearable-connect";
import {
  MorningCheckIn,
  MorningReminders,
  StoolCheckIn,
} from "./health-checkins";

const display = (value: number | null | undefined, digits = 0) =>
  value == null || !Number.isFinite(value)
    ? "—"
    : value.toLocaleString("en-IN", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });
function Metric({
  label,
  value,
  unit,
  digits = 0,
}: {
  label: string;
  value?: number | null;
  unit?: string;
  digits?: number;
}) {
  return (
    <div className="health-metric">
      <dt>{label}</dt>
      <dd>
        {display(value, digits)}
        {value != null && <span>{unit}</span>}
      </dd>
    </div>
  );
}
export type HealthSection = "body" | "blood" | "gut" | "lung";
const sectionNames: Record<HealthSection, string> = {
  body: "Overall body", blood: "Blood health", gut: "Gut", lung: "Lung",
};
export default function HealthOverview(p: ScreenProps & { detail?: HealthSection }) {
  const [health, setHealth] = useState<HealthMetrics>(() =>
      emptyHealth(p.date),
    ),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0),
    [dialog, setDialog] = useState<
      "weight" | "stool" | "reminders" | "whoop" | null
    >(null);
  useEffect(() => {
    if (location.hash === "#morning") setDialog("weight");
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setHealth(emptyHealth(p.date));
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    fetch(
      `/api/whoop/metrics?${new URLSearchParams({ date: p.date, timezone })}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const body = await response.json();
        if (controller.signal.aborted) return;
        if (body.date !== p.date) throw new Error();
        if (!response.ok) {
          setHealth({
            ...emptyHealth(p.date, body.configured, body.connected),
          });
          setError(
            body.error === "reconnect"
              ? "WHOOP needs to be reconnected."
              : "WHOOP couldn’t sync. Your journal entries are still here.",
          );
          return;
        }
        setHealth(body);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Couldn’t check WHOOP. Try refreshing when you’re online.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [p.date, refresh]);
  const close = useCallback(() => {
    setDialog(null);
    if (location.hash === "#morning") p.navigate("overview");
  }, [p.navigate]);
  const currentHealth = health.date === p.date ? health : emptyHealth(p.date);
  const stools = (p.data.stools || [])
    .filter((item) => item.date === p.date)
    .sort((a, b) => b.time.localeCompare(a.time));
  const weight = [...p.data.weights]
    .reverse()
    .filter((item) => item.date <= p.date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const recentStool = stools[0];
  return (
    <section className={`health-overview ${p.detail ? "health-detail" : "health-summary"}`} aria-label={p.detail ? `${sectionNames[p.detail]} details` : "Your health overview"}>
      {p.detail && (
        <div className="health-detail-navigation">
          <button className="health-back-button" onClick={() => p.navigate("overview")}><ArrowLeft size={17} /> Back to home</button>
          <DatePicker value={p.date} onChange={p.setDate} label="Health details date" showValue />
        </div>
      )}
      <div className="health-overview-heading">
        <div>
          {p.detail ? <h1>{sectionNames[p.detail]}</h1> : <h2>Your health, at a glance.</h2>}
          {p.detail && <p>
            {formatDate(p.date, { day: "numeric", month: "long" })} · A few
            signals. A fuller picture.
          </p>}
        </div>
        <button
          className="health-reminder-button"
          onClick={() => setDialog("reminders")}
        >
          <Bell size={17} />
          <span>Morning reminders</span>
        </button>
      </div>
      <div className="health-source-bar" role="status">
        <span
          className={`health-source-dot ${currentHealth.connected && !error ? "connected" : ""}`}
        />
        <span>
          {!p.detail ? (loading ? "Syncing WHOOP…" : error ? "Sync unavailable" : currentHealth.connected ? "WHOOP connected" : "Not connected") : loading
            ? "Checking WHOOP…"
            : error ||
              (currentHealth.connected
                ? "WHOOP connected · Scores appear when WHOOP has processed them."
                : "Connect WHOOP to bring your health signals into view.")}
        </span>
        {!loading && (!currentHealth.connected || error) && (
          <button onClick={() => setDialog("whoop")}>
            <Watch size={14} />
            {currentHealth.connected ? "Manage connection" : "Connect WHOOP"}
          </button>
        )}
        <button
          aria-label="Refresh WHOOP metrics"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
          <RefreshCw size={15} className={loading ? "is-refreshing" : ""} />
        </button>
      </div>
      {!p.detail ? (
        <div className="health-summary-cards">
          {([
            { key: "body", title: "Overall body", icon: Activity, value: currentHealth.recovery, unit: "%", label: "Recovery", digits: 0 },
            { key: "blood", title: "Blood health", icon: Droplet, value: currentHealth.spo2, unit: "%", label: "Blood oxygen", digits: 1 },
            { key: "gut", title: "Gut", icon: Leaf, value: stools.length ? 100 : 0, unit: "%", label: "Daily check-in", digits: 0 },
            { key: "lung", title: "Lung", icon: Wind, value: currentHealth.respiratoryRate, unit: "/min", label: "Respiratory rate", digits: 1 },
          ] as const).map((card) => (
            <article key={card.key} className={`health-summary-card health-summary-${card.key}`} aria-label={card.title}>
              <a href={`#health-${card.key}`} aria-label={`${card.title} details`} onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                event.preventDefault();
                p.navigate(`health-${card.key}`);
              }}>
                <span className="health-summary-title"><card.icon size={17} aria-hidden="true" /><span>{card.title}</span><ArrowUpRight size={15} aria-hidden="true" /></span>
                <span className="health-summary-value">{display(card.value, card.digits)}{card.value != null && <small>{card.unit}</small>}</span>
                <span className="health-summary-label">{card.label}</span>
              </a>
            </article>
          ))}
        </div>
      ) : (
      <div className="health-cards health-detail-cards">
        {p.detail === "body" && (

        <article
          className="health-card health-body-card"
          aria-label="Overall body"
        >
          <header>
            <span className="health-card-title">
              <Activity size={20} />
              <h3>Overall body</h3>
            </span>
            <span className="health-source-label">WHOOP + your check-ins</span>
          </header>
          <div className="health-body-layout">
            <div className="health-recovery">
              <p>Recovery</p>
              <strong>
                {display(currentHealth.recovery)}
                {currentHealth.recovery != null && <small>%</small>}
              </strong>
              <span>
                {currentHealth.recovery == null
                  ? "Your recovery score will appear here."
                  : "Your WHOOP recovery score"}
              </span>
            </div>
            <dl className="health-body-metrics">
              <Metric
                label="Sleep"
                value={currentHealth.sleepHours}
                unit="hrs"
                digits={1}
              />
              <Metric
                label="Daily strain"
                value={currentHealth.strain}
                unit="/ 21"
                digits={1}
              />
              <Metric label="Steps" value={currentHealth.steps} />
              <Metric
                label="Skin temperature"
                value={currentHealth.skinTemperature}
                unit="°C"
                digits={1}
              />
              <Metric label="Workouts" value={currentHealth.workoutCount} />
              <Metric
                label="Activity energy"
                value={currentHealth.energyKcal}
                unit="kcal"
              />
            </dl>
          </div>
          <div className="health-body-footer">
            <div>
              <Scale size={18} />
              <span>
                <strong>
                  {weight ? `${weight.weight} kg` : "Add your starting weight"}
                </strong>
                <small>
                  {weight
                    ? `You logged · ${formatDate(weight.date, { day: "numeric", month: "short" })}`
                    : "A morning check-in is a lovely place to start."}
                </small>
              </span>
            </div>
            <Button onClick={() => setDialog("weight")}>
              Morning check-in <ArrowRight size={16} />
            </Button>
          </div>
        </article>
        )}
        {p.detail === "blood" && (
        <article
          className="health-card health-blood-card"
          aria-label="Blood health"
        >
          <header>
            <span className="health-card-title">
              <Droplet size={20} />
              <h3>Blood health</h3>
            </span>
            <span className="health-source-label">WHOOP</span>
          </header>
          <p className="health-card-description">
            Circulation & oxygen signals
          </p>
          <dl>
            <Metric
              label="Blood oxygen"
              value={currentHealth.spo2}
              unit="%"
              digits={1}
            />
            <Metric
              label="Resting heart rate"
              value={currentHealth.restingHeartRate}
              unit="bpm"
            />
            <Metric
              label="Heart rate variability"
              value={currentHealth.hrv}
              unit="ms"
              digits={1}
            />
          </dl>
          <p className="health-card-note">
            Wearable signals, not a blood test.
          </p>
        </article>
        )}
        {p.detail === "gut" && (
        <article className="health-card health-gut-card" aria-label="Gut">
          <header>
            <span className="health-card-title">
              <Leaf size={20} />
              <h3>Gut</h3>
            </span>
            <span className="health-source-label">You log this</span>
          </header>
          <p className="health-card-description">
            Your daily digestive check-in
          </p>
          <dl>
            <Metric label="Bowel movements" value={stools.length || null} />
            <div className="health-metric">
              <dt>Latest Bristol type</dt>
              <dd>{recentStool ? `Type ${recentStool.type}` : "—"}</dd>
            </div>
            <div className="health-metric health-comfort">
              <dt>Comfort</dt>
              <dd>{recentStool ? recentStool.comfort : "—"}</dd>
            </div>
          </dl>
          <button
            className="health-card-link"
            onClick={() => setDialog("stool")}
          >
            Log a gut check-in <ArrowUpRight size={17} />
          </button>
          <p className="health-card-note">
            Manual journal · Not measured by WHOOP. The home percentage shows whether you’ve logged a check-in for this date, not a gut health score.
          </p>
        </article>
        )}
        {p.detail === "lung" && (
        <article className="health-card health-lung-card" aria-label="Lung">
          <header>
            <span className="health-card-title">
              <Wind size={20} />
              <h3>Lung</h3>
            </span>
            <span className="health-source-label">WHOOP</span>
          </header>
          <p className="health-card-description">Breathing during sleep</p>
          <dl>
            <Metric
              label="Respiratory rate"
              value={currentHealth.respiratoryRate}
              unit="breaths/min"
              digits={1}
            />
            <Metric
              label="Sleep performance"
              value={currentHealth.sleepPerformance}
              unit="%"
            />
          </dl>
          <p className="health-card-note">
            Breathing signals, not a lung-function test.
          </p>
        </article>
        )}
      </div>
      )}
      {p.detail && <p className="health-footnote">
        {currentHealth.fetchedAt
          ? `Fetched ${new Date(currentHealth.fetchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}. `
          : ""}
        WHOOP strain follows the cycle starting on this date; sleep is shown on
        its ending date. Missing readings stay blank.
      </p>}
      {dialog === "weight" && (
        <MorningCheckIn data={p.data} update={p.update} onClose={close} />
      )}
      {dialog === "stool" && <StoolCheckIn update={p.update} onClose={close} />}
      {dialog === "reminders" && (
        <MorningReminders
          onClose={close}
          loggedToday={p.data.weights.some((entry) => entry.date === dateKey())}
        />
      )}
      {dialog === "whoop" && (
        <Sheet
          title="Connect your WHOOP"
          onClose={() => {
            close();
            setRefresh((value) => value + 1);
          }}
        >
          <WearableConnect
            returnTo="home"
            choice={p.data.wearablePreference}
            onSelect={(wearablePreference) =>
              p.update((s) => ({ ...s, wearablePreference }))
            }
            beforeConnect={() => true}
          />
        </Sheet>
      )}
    </section>
  );
}

```

#### src/components/journal-app.tsx

```tsx
"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CheckCheck,
  ChevronDown,
  Dumbbell,
  Flag,
  House,
  LayoutGrid,
  LibraryBig,
  Leaf,
  Menu,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import gsap from "gsap";
import { createPortal } from "react-dom";
import {
  initialStore,
  newMemberStore,
  TODAY,
  formatDate,
  type Store,
} from "@/lib/model";
import { Button } from "./ui";
import Dashboard from "./overview";
import HealthOverview, { type HealthSection } from "./health-overview";
import {
  Planner,
  Habits,
  Challenge,
  WeightTracker,
  Results,
  Review,
  NutritionScreen,
} from "./journal-screens";
import { Trainer, WorkoutScreen } from "./workouts";
import WorkoutLibrary from "./workout-library";
import Onboarding, { AccountEntry } from "./onboarding";
export type ScreenProps = {
  data: Store;
  update: (fn: (s: Store) => Store, message?: string) => void;
  navigate: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
};
const nav = [
  { id: "overview", label: "Overview", icon: House },
  { id: "workout", label: "My workouts", icon: Dumbbell },
  { id: "library", label: "Workout library", icon: LibraryBig },
  { id: "nutrition", label: "Nutrition & wellness", icon: Leaf },
  { id: "planner", label: "Monthly planner", icon: CalendarDays },
  { id: "habits", label: "Habit tracker", icon: CheckCheck },
  { id: "challenge", label: "100-day challenge", icon: Flag },
  { id: "weight", label: "Weight tracker", icon: ChartNoAxesCombined },
  { id: "results", label: "Starting point & results", icon: Activity },
  { id: "review", label: "Monthly review", icon: BookOpen },
];
export default function JournalApp() {
  const [data, setData] = useState<Store | null>(null),
    [view, setView] = useState("overview"),
    [signedIn, setSignedIn] = useState(false),
    [demoMode, setDemoMode] = useState(false),
    [role, setRole] = useState("member"),
    [date, setDate] = useState(TODAY),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const launchCoverRef = useRef<HTMLDivElement>(null);
  const [launchCover, setLaunchCover] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const launchOrigin = useRef<{ x: number; y: number } | null>(null);
  const content = useRef<HTMLElement>(null),
    inputMode = useRef<"pointer" | "keyboard">("pointer"),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const pointer = () => {
      inputMode.current = "pointer";
    };
    const keyboard = () => {
      inputMode.current = "keyboard";
    };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
    };
  }, []);
  useEffect(() => {
    // Remove data retained by earlier prototype versions; this session stays in memory.
    try {
      localStorage.removeItem("form-journal-v1");
      sessionStorage.removeItem("form-session");
      sessionStorage.removeItem("form-sample");
    } catch {}
    setData(initialStore());
    const hash = () => {
      const v = location.hash.slice(1) || "overview";
      setView(v);
      setRole(
        v === "trainer" || v === "trainer-library" ? "trainer" : "member",
      );
    };
    hash();
    window.addEventListener("hashchange", hash);
    return () => window.removeEventListener("hashchange", hash);
  }, []);
  useLayoutEffect(() => {
    if (!data || !content.current) return;
    const origin = launchOrigin.current;
    launchOrigin.current = null;
    if (origin || view.startsWith("health-")) {
      window.scrollTo({ top: 0, behavior: "instant" });
      const heading = content.current.querySelector<HTMLElement>("h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }
    const ctx = gsap.context(() => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const homeElements = content.current!.querySelectorAll(
        ".journal-heading, .week-strip, .health-overview-heading, .health-source-bar, .health-card, .health-summary-card, .journal-main > section, .journal-aside > section, .journal-index",
      );
      if (origin && shell.current) {
        if (launchCoverRef.current) {
          gsap.to(launchCoverRef.current, {
            opacity: 0,
            duration: 0.45,
            ease: "power2.out",
            onComplete: () => setLaunchCover(null),
          });
        }
        gsap.fromTo(
          homeElements,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.065,
            delay: 0.12,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
        );
      } else if (inputMode.current !== "keyboard") {
        if (view === "overview") {
          gsap.fromTo(
            homeElements,
            { opacity: 0.4, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.05,
              ease: "power3.out",
              clearProps: "transform,opacity",
            },
          );
        } else {
          gsap.fromTo(
            ".screen-content",
            { y: 6, opacity: 0.78 },
            {
              y: 0,
              opacity: 1,
              duration: 0.22,
              ease: "power3.out",
              clearProps: "transform,opacity",
            },
          );
        }
      }
    }, shell);
    return () => ctx.revert();
  }, [view, role, !!data, signedIn, demoMode]);
  const navigate = useCallback((v: string) => {
    setView(v);
    location.hash = v;
    setMenu(false);
    window.scrollTo({
      top: 0,
      behavior:
        matchMedia("(prefers-reduced-motion: reduce)").matches ||
        inputMode.current === "keyboard"
          ? "instant"
          : "smooth",
    });
  }, []);
  useLayoutEffect(() => {
    if (!launchCover || !launchCoverRef.current) return;
    const cover = launchCoverRef.current;
    const timeline = gsap.timeline({
      onComplete: () => {
        launchOrigin.current = { x: launchCover.x, y: launchCover.y };
        setRole("member");
        navigate("overview");
        window.scrollTo({ top: 0, behavior: "instant" });
      },
    });
    const x = launchCover.x + launchCover.width / 2;
    const y = launchCover.y + launchCover.height / 2;
    const radius =
      Math.ceil(
        Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)),
      ) + 2;
    timeline.to(cover, {
      clipPath: `circle(${radius}px at ${x}px ${y}px)`,
      duration: 1.1,
      ease: "power2.inOut",
    });
    return () => {
      timeline.kill();
    };
  }, [launchCover, navigate]);
  const launchOverlay = launchCover
    ? createPortal(
        <div
          ref={launchCoverRef}
          className="app-launch-cover"
          aria-hidden="true"
          style={{
            inset: 0,
            width: "100vw",
            height: "100dvh",
            clipPath: `circle(0px at ${launchCover.x + launchCover.width / 2}px ${launchCover.y + launchCover.height / 2}px)`,
          }}
        />,
        document.body,
      )
    : null;
  const update = useCallback((fn: (s: Store) => Store, message?: string) => {
    setData((s) => (s ? fn(s) : s));
    if (message) {
      setToast(message);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 3500);
    }
  }, []);
  if (!data)
    return (
      <div className="loading">
        <div className="wordmark">
          form<span>.</span>
        </div>
        <p>Opening your journal…</p>
      </div>
    );
  const props: ScreenProps = { data, update, navigate, date, setDate };
  if (!signedIn && !demoMode)
    return (
      <AccountEntry
        onDemo={() => {
          setDemoMode(true);
          window.scrollTo({ top: 0, behavior: "instant" });
        }}
        onEnter={(email, name, signup) => {
          const next = !signup && data.account?.email === email
            ? data
            : newMemberStore(email, signup ? name : "");
          update(() => next);
          setSignedIn(true);
          setDemoMode(false);
          navigate(
            next.onboarded
              ? location.hash === "#morning"
                ? "morning"
                : "overview"
              : "onboarding",
          );
        }}
      />
    );
  if ((signedIn && !data.onboarded) || view === "onboarding")
    return (
      <>
        <Onboarding
          {...props}
          onOpenApp={(origin) => {
            if (launchCover) return;
            if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
              launchOrigin.current = origin;
              setRole("member");
              navigate("overview");
              window.scrollTo({ top: 0, behavior: "instant" });
            } else setLaunchCover(origin);
          }}
        />
        {launchOverlay}
      </>
    );
  const trainer = role === "trainer";
  const switchRole = (r: string) => {
    setRole(r);
    navigate(r === "trainer" ? "trainer" : "overview");
  };
  const healthSection = view.startsWith("health-") && ["body", "blood", "gut", "lung"].includes(view.slice(7)) ? view.slice(7) as HealthSection : undefined;
  const active = nav.find((n) => n.id === view);
  const render = () => {
    if (healthSection) return <HealthOverview {...props} detail={healthSection} />;
    if (view === "library" || view === "trainer-library")
      return <WorkoutLibrary {...props} />;
    if (trainer) return <Trainer {...props} />;
    switch (view) {
      case "planner":
        return <Planner {...props} />;
      case "habits":
        return <Habits {...props} />;
      case "challenge":
        return <Challenge {...props} />;
      case "weight":
        return <WeightTracker {...props} />;
      case "results":
        return <Results {...props} />;
      case "review":
        return <Review {...props} />;
      case "nutrition":
        return <NutritionScreen {...props} />;
      case "onboarding":
        return <Onboarding {...props} />;
      case "workout":
        return <WorkoutScreen {...props} />;
      default:
        return <Dashboard {...props} />;
    }
  };
  return (
    <>
      <div className="app-shell" ref={shell}>
        <aside className={`sidebar ${menu ? "mobile-open" : ""}`}>
          <div className="sidebar-top">
            <a
              className="wordmark"
              href="#overview"
              onClick={() => switchRole("member")}
            >
              form<span>.</span>
            </a>
            <button
              className="icon-button mobile-only"
              aria-label="Close menu"
              onClick={() => setMenu(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="workspace">
            <div className="workspace-icon">
              <Dumbbell size={19} />
            </div>
            <div>
              <strong>Training journal</strong>
              <span>Member workspace</span>
            </div>
          </div>
          <div className="side-section-label">YOUR JOURNAL</div>
          <nav aria-label="Main navigation">
            {(trainer
              ? [
                  { id: "trainer", label: "My members", icon: Users },
                  {
                    id: "trainer-library",
                    label: "Workout library",
                    icon: LibraryBig,
                  },
                ]
              : nav
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`nav-item ${view === item.id ? "active" : ""}`}
              >
                <item.icon size={19} strokeWidth={1.7} />
                <span>{item.label}</span>
                {view === item.id && <span className="nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            {!trainer && (
              <button
                className="setup-card"
                onClick={() => navigate("onboarding")}
              >
                <span className="setup-link">
                  Set up your journal <ArrowUpRight size={16} />
                </span>
              </button>
            )}
            <button
              className="nav-item"
              onClick={() => {
                      setData(initialStore());
                setSignedIn(false);
                setDemoMode(false);
                navigate("overview");
              }}
            >
              Log out
            </button>
            <div className="profile">
              <span className="avatar">
                {trainer
                  ? "KM"
                  : (data.profile.Name || "Arjun Sharma")
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
              </span>
              <div>
                <strong>{trainer ? "Kabir Mehta" : data.profile.Name}</strong>
                <span>
                  {trainer ? "Personal trainer" : "Member · demo journal"}
                </span>
              </div>
              <Settings2 size={16} />
            </div>
          </div>
        </aside>
        {menu && <div className="nav-scrim" onClick={() => setMenu(false)} />}
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-only"
                aria-label="Open navigation"
                onClick={() => setMenu(true)}
              >
                <Menu size={21} />
              </button>
              <span className="desktop-only">My journal</span>
              <span className="breadcrumb-divider desktop-only">/</span>
              <strong>
                {view === "trainer-library"
                  ? "Workout library"
                  : trainer
                    ? "Trainer space"
                    : healthSection ? "Health details" : active?.label || "Set up your journal"}
              </strong>
            </div>
            <div className="topbar-right">
              <span className="saved-state">
                <span className="status-dot" />
                Current session only
              </span>
              <div
                className="view-tabs"
                role="tablist"
                aria-label="Dashboard role"
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                    e.preventDefault();
                    switchRole(trainer ? "member" : "trainer");
                    document
                      .getElementById(trainer ? "member-tab" : "trainer-tab")
                      ?.focus();
                  }
                }}
              >
                <button
                  id="member-tab"
                  role="tab"
                  aria-controls="dashboard-panel"
                  tabIndex={!trainer ? 0 : -1}
                  aria-selected={!trainer}
                  className={!trainer ? "selected" : ""}
                  onClick={() => switchRole("member")}
                >
                  <House size={14} />
                  <span>Member view</span>
                </button>
                <button
                  id="trainer-tab"
                  role="tab"
                  aria-controls="dashboard-panel"
                  tabIndex={trainer ? 0 : -1}
                  aria-selected={trainer}
                  className={trainer ? "selected" : ""}
                  onClick={() => switchRole("trainer")}
                >
                  <Users size={14} />
                  <span>Trainer view</span>
                </button>
              </div>
              <span className="avatar small">
                {trainer
                  ? "KM"
                  : (data.profile.Name || "You")
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
              </span>
            </div>
          </header>
          <main
            ref={content}
            id="dashboard-panel"
            role="tabpanel"
            aria-labelledby={trainer ? "trainer-tab" : "member-tab"}
          >
            <div className="screen-content" key={`${role}-${view}`}>
              {render()}
            </div>
            <footer className="page-footer">
              <span className="footer-brand">form.</span>
              <span>Training, nutrition & the work between.</span>
              <span className="demo-note">
                Sample journal · browser prototype
              </span>
            </footer>
          </main>
        </div>
        <nav className="bottom-nav" aria-label="Mobile navigation">
          {[
            {
              id: trainer ? "trainer" : "overview",
              label: trainer ? "Members" : "Today",
              icon: trainer ? Users : House,
            },
            { id: "workout", label: "Workout", icon: Dumbbell },
            { id: "nutrition", label: "Nutrition", icon: Leaf },
            { id: "menu", label: "Journal", icon: LayoutGrid },
          ]
            .filter((i) => !trainer || i.id === "trainer" || i.id === "menu")
            .map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  item.id === "menu" ? setMenu(true) : navigate(item.id)
                }
                className={view === item.id || (item.id === "overview" && healthSection) ? "selected" : ""}
              >
                <item.icon size={21} />
                <span>{item.label}</span>
              </button>
            ))}
        </nav>
        {toast && (
          <div className="toast" role="status">
            <span className="toast-check">
              <Check size={15} />
            </span>
            {toast}
          </div>
        )}
      </div>
      {launchOverlay}
    </>
  );
}

```

#### src/lib/health.ts

```ts
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
export const bristolTypes = [
  { type: 1, title: "Separate hard lumps", detail: "Small, firm pieces" },
  {
    type: 2,
    title: "Lumpy and sausage-shaped",
    detail: "Firm with visible lumps",
  },
  {
    type: 3,
    title: "Sausage with surface cracks",
    detail: "Formed with some cracks",
  },
  { type: 4, title: "Smooth and soft", detail: "Sausage or snake-shaped" },
  { type: 5, title: "Soft blobs", detail: "Separate pieces with clear edges" },
  { type: 6, title: "Mushy pieces", detail: "Fluffy with ragged edges" },
  { type: 7, title: "Watery", detail: "Liquid with no solid pieces" },
];
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

```

#### src/lib/model.ts

```ts
export type SetCompletions = Record<string, boolean[]>;
export type SetEntry = { reps: string; weight: string };
export type Exercise = { id: string; name: string; sets: SetEntry[] };
export type Cardio = {
  id: string;
  type: string;
  time: string;
  distance: string;
  calories: string;
};
export type Workout = {
  muscle: string;
  warmup: string;
  cooldown: string;
  notes: string;
  exercises: Exercise[];
  cardio: Cardio[];
  start: string;
  finish: string;
  total: string;
  satisfaction: number;
  version: number;
  savedAt?: string;
  planVersion?: number;
  planSnapshot?: Workout;
  templateId?: string;
  templateName?: string;
};
export type Habit = {
  id: string;
  name: string;
  marks: string[];
  kind?: "build" | "break";
};
export type OnboardingDraft = {
  wearable?: "whoop" | "none";
  step: number;
  goals: string[];
  accepted: boolean;
  dayOne: boolean;
  target: string;
  weight: Omit<WeightEntry, "id">;
  habits: Habit[];
  name: string;
  height: string;
  goal: string;
};
export type StoolEntry = {
  id: string;
  date: string;
  time: string;
  type: number;
  comfort: string;
  notes: string;
};
export type WeightEntry = {
  source?: "photo" | "manual";
  afterBathroom?: boolean;
  id: string;
  date: string;
  weight: string;
  gain: string;
  loss: string;
  notes: string;
};
export type Food = {
  id: string;
  product: string;
  serving: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};
export type Nutrition = {
  metrics: Record<string, string>;
  water: number;
  meals: Record<string, Food[]>;
};
export type Member = {
  id: string;
  name: string;
  initials: string;
  description: string;
};
export const members: Member[] = [
  {
    id: "alex",
    name: "Arjun Sharma",
    initials: "AS",
    description: "Strength program · joined October",
  },
  {
    id: "jamie",
    name: "Meera Iyer",
    initials: "MI",
    description: "General fitness · joined November",
  },
  {
    id: "sam",
    name: "Rohan Patel",
    initials: "RP",
    description: "Strength program · joined September",
  },
];
export type WorkoutTemplate = {
  id: string;
  name: string;
  workout: Workout;
  updatedAt: string;
};
export type Store = {
  onboarded: boolean;
  account?: { email: string };
  onboardingDraft?: OnboardingDraft;
  challengeAccepted?: boolean;
  wearablePreference?: "whoop" | "none";
  month: string;
  goalsByMonth: Record<string, string[]>;
  profile: Record<string, string>;
  habits: Habit[];
  planner: Record<string, string>;
  challenge: number[];
  challengeTarget: string;
  challengeNote: string;
  weights: WeightEntry[];
  stools?: StoolEntry[];
  measurements: Record<string, Record<string, string>>;
  baselineMeasurements?: Record<string, string>;
  resultDates: { now: string; previous: string };
  before: string;
  after: string;
  reviews: Record<string, Record<string, string>>;
  nutrition: Record<string, Nutrition>;
  plans: Record<string, Workout>;
  logs: Record<string, Workout>;
  setCompletions?: Record<string, SetCompletions>;
  workoutLibrary?: WorkoutTemplate[];
};
export const measurements = [
  "Neck",
  "Shoulders",
  "Chest",
  "Bicep",
  "Waist",
  "Hip",
  "Thigh",
  "Calf",
  "Weight",
  "Body Fat %",
];
export const meals = ["Breakfast", "Lunch", "Dinner", "Supplements/Snacks"];
export const uid = () => {
  // randomUUID requires HTTPS (or localhost); getRandomValues also works on LAN HTTP.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4),
    hex.slice(4, 6),
    hex.slice(6, 8),
    hex.slice(8, 10),
    hex.slice(10),
  ]
    .map((part) => part.join(""))
    .join("-");
};
export const dateKey = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
export const TODAY = dateKey();
export const makeExercise = (name = ""): Exercise => ({
  id: uid(),
  name,
  sets: Array.from({ length: 6 }, () => ({ reps: "", weight: "" })),
});
export const emptyWorkout = (): Workout => ({
  muscle: "",
  warmup: "",
  cooldown: "",
  notes: "",
  exercises: [],
  cardio: [],
  start: "",
  finish: "",
  total: "",
  satisfaction: 50,
  version: 0,
});
export const emptyNutrition = (): Nutrition => ({
  metrics: {},
  water: 0,
  meals: Object.fromEntries(meals.map((m) => [m, []])),
});
export function initialStore(): Store {
  const month = TODAY.slice(0, 7);
  const exercise = (
    id: string,
    name: string,
    reps: string,
    weight: string,
  ): Exercise => ({
    id,
    name,
    sets: Array.from({ length: 6 }, (_, i) => ({
      reps: i < 3 ? reps : "",
      weight: i < 3 ? weight : "",
    })),
  });
  const plan: Workout = {
    ...emptyWorkout(),
    muscle: "Upper body strength",
    warmup: "5 min rowing, arm circles & band pull-aparts",
    cooldown: "5 min upper-body stretches",
    notes:
      "Control the lowering phase. Rest 90 seconds between sets. Quality over quantity.",
    exercises: [
      exercise("e1", "Barbell bench press", "10", "40"),
      exercise("e2", "Seated cable row", "12", "35"),
      exercise("e3", "Dumbbell shoulder press", "10", "12"),
      exercise("e4", "Lat pulldown", "12", "40"),
    ],
    cardio: [
      {
        id: "c1",
        type: "Incline walk",
        time: "10",
        distance: "0.8",
        calories: "65",
      },
    ],
    version: 1,
    savedAt: TODAY,
  };
  return {
    onboarded: false,
    month,
    goalsByMonth: {
      [month]: [
        "Train 4 days a week",
        "Bench press 50 kg",
        "Sleep 7+ hours on weekdays",
        "Walk 8,000 steps a day",
      ],
    },
    profile: {
      Name: "Arjun Sharma",
      "Starting weight (kg)": "72.5",
      "Height (cm)": "175",
      "My Goal": "Maintain weight",
    },
    habits: [
      {
        id: "h1",
        name: "Move for 30 minutes",
        marks: [`${month}-15`, `${month}-16`, TODAY],
      },
      {
        id: "h2",
        name: "Sleep for 8 hours",
        marks: [`${month}-15`, `${month}-16`],
      },
      {
        id: "h3",
        name: "Eat a protein-rich breakfast",
        marks: [`${month}-16`, TODAY],
      },
      { id: "h4", name: "Read for 10 minutes", marks: [`${month}-15`] },
    ],
    planner: { [TODAY]: "Upper body · focus on good form" },
    challenge: Array.from({ length: 17 }, (_, i) => i + 1),
    challengeTarget: "Walk 8,000 steps every day.",
    challengeNote: "Evening walks after work.",
    weights: [
      {
        id: "w1",
        date: `${month}-01`,
        weight: "72.5",
        gain: "0",
        loss: "0",
        notes: "Starting this month feeling focused.",
      },
      {
        id: "w2",
        date: `${month}-10`,
        weight: "72.2",
        gain: "0",
        loss: "0.3",
        notes: "Keeping things consistent.",
      },
    ],
    measurements: {
      [month]: {
        Neck: "36",
        Shoulders: "112",
        Chest: "96",
        Bicep: "32",
        Waist: "79",
        Hip: "94",
        Thigh: "54",
        Calf: "36",
        Weight: "72.2",
        "Body Fat %": "18",
      },
    },
    resultDates: { now: TODAY, previous: "" },
    before: "",
    after: "",
    reviews: {},
    nutrition: {
      [TODAY]: {
        metrics: {
          "Weight (kg)": "72.2",
          "Sleep (hours)": "7.5",
          Steps: "6840",
        },
        water: 2,
        meals: {
          Breakfast: [
            {
              id: "f1",
              product: "Greek yogurt with oats",
              serving: "250 g",
              calories: "320",
              protein: "24",
              carbs: "42",
              fat: "6",
            },
          ],
          Lunch: [],
          Dinner: [],
          "Supplements/Snacks": [],
        },
      },
      [`jamie:${TODAY}`]: {
        metrics: {
          "Weight (kg)": "58.4",
          "Sleep (hours)": "8",
          Steps: "9200",
        },
        water: 3,
        meals: {
          Breakfast: [
            {
              id: "f2",
              product: "Poha with roasted peanuts",
              serving: "200 g",
              calories: "280",
              protein: "8",
              carbs: "48",
              fat: "7",
            },
          ],
          Lunch: [
            {
              id: "f3",
              product: "Paneer wrap & salad",
              serving: "1 wrap",
              calories: "410",
              protein: "22",
              carbs: "35",
              fat: "18",
            },
          ],
          Dinner: [],
          "Supplements/Snacks": [],
        },
      },
      [`sam:${TODAY}`]: {
        metrics: {
          "Weight (kg)": "81.0",
          "Sleep (hours)": "7",
          Steps: "7500",
        },
        water: 2,
        meals: {
          Breakfast: [
            {
              id: "f4",
              product: "Omelette with multigrain toast",
              serving: "3 eggs + 2 slices",
              calories: "390",
              protein: "28",
              carbs: "30",
              fat: "14",
            },
          ],
          Lunch: [],
          Dinner: [],
          "Supplements/Snacks": [],
        },
      },
    },
    plans: { [`alex:${TODAY}`]: plan },
    logs: {},
    setCompletions: {},
    workoutLibrary: [],
  };
}
export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  },
) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", options);
}
export function monthLabel(month: string) {
  return new Date(month + "-01T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
export function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
export function totalNutrition(n: Nutrition) {
  return Object.values(n.meals)
    .flat()
    .reduce(
      (a, f) => ({
        calories: a.calories + (Number(f.calories) || 0),
        protein: a.protein + (Number(f.protein) || 0),
        carbs: a.carbs + (Number(f.carbs) || 0),
        fat: a.fat + (Number(f.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
}

export function monthlyGoals(data: Store): string[] {
  return data.goalsByMonth[data.month] || ["", "", "", ""];
}
export function restoreStore(value: unknown): Store {
  const data = value as Store & { goals?: string[] };
  if (!data || !data.profile || !Array.isArray(data.habits) || !data.month)
    throw new Error("Invalid journal");
  if (!data.goalsByMonth)
    data.goalsByMonth = { [data.month]: data.goals || ["", "", "", ""] };
  delete data.goals;
  if (data.profile.Name === "Alex Morgan") data.profile.Name = "Arjun Sharma";
  const demoGoals: Record<string, string> = {
    "Build a consistent training routine": "Train 4 days a week",
    "Get stronger, one session at a time": "Bench press 50 kg",
    "Prioritize 7–8 hours of sleep": "Sleep 7+ hours on weekdays",
    "Make time for recovery": "Walk 8,000 steps a day",
  };
  for (const month of Object.keys(data.goalsByMonth))
    data.goalsByMonth[month] = data.goalsByMonth[month].map(
      (g) => demoGoals[g] || g,
    );
  if (data.challengeTarget === "Show up for myself, every day.")
    data.challengeTarget = "Walk 8,000 steps every day.";
  return data;
}

/** Copy prescribed fields with fresh row IDs; never copy actuals or completion. */
export function copyWorkoutPlan(source: Workout): Workout {
  return {
    ...emptyWorkout(),
    muscle: source.muscle,
    warmup: source.warmup,
    cooldown: source.cooldown,
    notes: source.notes,
    exercises: source.exercises.map((e) => ({
      id: uid(),
      name: e.name,
      sets: Array.from({ length: 6 }, (_, i) => ({
        reps: e.sets[i]?.reps || "",
        weight: e.sets[i]?.weight || "",
      })),
    })),
    cardio: source.cardio.map((c) => ({ ...c, id: uid() })),
  };
}

/** A new member starts with their own records, without illustrative sample data. */
export function newMemberStore(email: string, name: string): Store {
  const seed = initialStore();
  return {
    ...seed,
    account: { email },
    profile: { Name: name },
    goalsByMonth: {},
    habits: [],
    planner: {},
    challenge: [],
    challengeTarget: "",
    challengeNote: "",
    weights: [],
    measurements: {},
    baselineMeasurements: {},
    before: "",
    after: "",
    reviews: {},
    nutrition: {},
    plans: {},
    logs: {},
    setCompletions: {},
    workoutLibrary: [],
  };
}

```

#### src/app/health.css

```css
.health-overview {
  margin: 28px 0 36px;
}
.health-overview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}
.health-overview-heading h2 {
  font-size: 24px;
  letter-spacing: -0.025em;
  font-weight: 600;
  margin: 0 0 6px;
}
.health-overview-heading p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}
.health-reminder-button {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  padding: 12px 16px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  min-height: 44px;
  font-size: 12px;
}
.health-source-bar {
  display: flex;
  gap: 9px;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  min-height: 44px;
}
.health-source-bar > span:nth-child(2) {
  flex: 1;
}
.health-source-bar button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 44px;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  padding: 8px;
}
.health-source-dot {
  width: 7px;
  height: 7px;
  background: var(--neutral-300);
  border-radius: 50%;
  flex-shrink: 0;
}
.health-source-dot.connected {
  background: var(--neutral-950);
}
.health-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.health-card {
  background: var(--surface-card);
  border-radius: var(--radius-card);
  padding: 26px;
  min-width: 0;
}
.health-card > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.health-card-title {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}
.health-card-title h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.02em;
}
.health-source-label {
  font-size: 11px;
  color: var(--text-secondary);
}
.health-card-description {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 12px 0 24px;
}
.health-body-card {
  grid-column: 1 / -1;
  background: var(--lime-100);
  padding: 30px;
}
.health-body-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
  align-items: center;
  margin: 30px 0;
}
.health-recovery p {
  margin: 0 0 8px;
  font-size: 14px;
}
.health-recovery > strong {
  display: block;
  font-size: 80px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: -0.035em;
  font-variant-numeric: tabular-nums;
}
.health-recovery strong small {
  font-size: 28px;
  margin-left: 4px;
}
.health-recovery > span {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 16px;
}
.health-body-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 26px 20px;
  margin: 0;
}
.health-metric dt {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 7px;
}
.health-metric dd {
  font-size: 28px;
  line-height: 1.2;
  font-weight: 500;
  letter-spacing: -0.025em;
  margin: 0;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.health-metric dd span {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
  margin-left: 5px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.health-body-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #b8cf94;
  padding-top: 22px;
}
.health-body-footer > div {
  display: flex;
  gap: 12px;
  align-items: center;
}
.health-body-footer strong {
  display: block;
  font-size: 14px;
  font-weight: 500;
}
.health-body-footer small {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 5px;
}
.health-blood-card {
  background: var(--category-a);
}
.health-lung-card {
  background: var(--category-c);
}
.health-card:not(.health-body-card) > dl {
  display: grid;
  gap: 20px;
  margin: 0 0 24px;
}
.health-card-note,
.health-footnote {
  font-size: 11px;
  line-height: 1.7;
  color: var(--text-secondary);
}
.health-footnote {
  margin: 14px 0 0;
  max-width: 90ch;
}
.health-card-note {
  margin-top: 20px;
}
.health-comfort dd {
  font-size: 20px;
  text-transform: capitalize;
}
.health-card-link {
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  font-size: 12px;
}
.health-sheet .health-intro {
  font-size: 20px;
  line-height: 1.35;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
}
.health-sheet .helper {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 12px;
  margin: 14px 0 20px;
}
.health-sheet .field {
  margin-bottom: 18px;
}
.health-sheet select {
  display: block;
  width: 100%;
  background: var(--neutral-25);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 13px;
  min-height: 50px;
}
.health-form-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 22px;
}
.health-entry-date {
  margin: 20px 0;
}
.health-entry-date > span {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 9px;
}
.health-form-pair .health-entry-date {
  margin: 0;
}
.health-entry-date .custom-date-trigger {
  background: var(--neutral-25);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  width: 100%;
  min-height: 50px;
  padding: 12px;
  justify-content: flex-start;
}
.health-entry-date .custom-date-trigger svg {
  margin-right: 4px;
}
.health-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  line-height: 1.8;
  min-height: 44px;
  margin: 18px 0;
  cursor: pointer;
}
.health-checkbox input {
  margin-top: 5px;
  accent-color: var(--neutral-950);
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}
.scale-photo-area {
  background: var(--neutral-25);
  border-radius: 20px;
  padding: 24px;
  text-align: center;
}
.scale-photo-area > div {
  display: grid;
  justify-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.scale-photo-area strong {
  font-size: 15px;
  font-weight: 500;
}
.scale-photo-area span {
  color: var(--text-secondary);
  font-size: 12px;
}
.scale-photo-area img {
  max-height: 200px;
  max-width: 100%;
  object-fit: contain;
  border-radius: 10px;
  margin: 0 auto 18px;
}
.health-message {
  padding: 16px;
  background: var(--neutral-50);
  font-size: 12px;
  line-height: 1.8;
  border-radius: 14px;
  margin: 18px 0;
}
.bristol-options {
  border: 0;
  padding: 0;
  margin: 24px 0;
  display: grid;
  gap: 8px;
}
.bristol-options legend,
.reminder-tone legend {
  margin-bottom: 14px;
  font-size: 13px;
}
.bristol-options label {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  cursor: pointer;
}
.bristol-options .selected {
  background: var(--lime-100);
  border-color: var(--lime-100);
}
.bristol-options input,
.reminder-tone input {
  accent-color: var(--neutral-950);
}
.bristol-number {
  width: 24px;
  font-size: 18px;
  text-align: center;
}
.bristol-options strong {
  display: block;
  font-size: 13px;
  font-weight: 500;
}
.bristol-options small {
  display: block;
  color: var(--text-secondary);
  font-size: 11px;
  margin-top: 5px;
}
.reminder-tone {
  border: 0;
  padding: 0;
  display: grid;
  gap: 10px;
  margin: 24px 0;
}
.reminder-tone label {
  min-height: 44px;
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 13px;
}
.reminder-preview {
  padding: 20px;
  background: var(--lime-100);
  border-radius: 18px;
  font-size: 13px;
}
.reminder-preview strong {
  font-size: 12px;
  font-weight: 500;
}
.reminder-preview p {
  margin: 8px 0 0;
  line-height: 1.7;
}
.health-inline-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}
@media (max-width: 1180px) {
  .health-card {
    padding: 22px;
  }
  .health-body-layout {
    gap: 28px;
  }
  .health-body-metrics {
    gap: 24px 16px;
  }
}
@media (max-width: 760px) {
  .health-overview {
    margin-top: 24px;
  }
  .health-overview-heading {
    align-items: flex-start;
    gap: 10px;
  }
  .health-overview-heading h2 {
    font-size: 22px;
    max-width: 14ch;
  }
  .health-overview-heading p {
    font-size: 11px;
    max-width: 28ch;
    line-height: 1.7;
  }
  .health-reminder-button {
    padding: 12px;
    font-size: 11px;
  }
  .health-reminder-button span {
    max-width: 8ch;
    line-height: 1.4;
  }
  .health-source-bar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .health-source-bar > span:nth-child(2) {
    flex-basis: calc(100% - 24px);
    line-height: 1.7;
  }
  .health-source-bar > button:nth-last-child(2) {
    margin-left: 12px;
  }
  .health-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .health-card {
    padding: 24px;
  }
  .health-body-layout {
    grid-template-columns: 1fr;
    gap: 30px;
    margin: 28px 0;
  }
  .health-recovery > strong {
    font-size: 72px;
  }
  .health-body-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .health-body-footer {
    align-items: flex-start;
    flex-direction: column;
  }
  .health-body-footer > .btn {
    width: 100%;
    justify-content: space-between;
  }
  .health-card:not(.health-body-card) > dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .health-metric dd {
    font-size: 26px;
  }
  .health-metric dd span {
    display: inline;
    font-size: 10px;
  }
  .health-form-pair {
    gap: 12px;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .is-refreshing {
    animation: health-spin 1s linear infinite;
  }
  @keyframes health-spin {
    to {
      transform: rotate(360deg);
    }
  }
}

/* Mobile home shows four entry points; readings and actions live on detail pages. */
.health-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.health-summary-card {
  --health-wash: var(--lime-100);
  min-width: 0;
  border-radius: 20px;
  background: radial-gradient(
    ellipse at center,
    var(--health-wash) 0%,
    var(--surface-card) 85%
  );
}
.health-summary-body { --health-wash: var(--lime-100); }
.health-summary-blood { --health-wash: var(--category-a); }
.health-summary-gut { --health-wash: var(--category-b); }
.health-summary-lung { --health-wash: var(--category-c); }
.health-summary-card > a {
  display: flex;
  flex-direction: column;
  padding: 18px;
  min-height: 146px;
  height: 100%;
  border-radius: inherit;
  color: inherit;
  text-decoration: none;
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms ease-out;
}
.health-summary-card > a:focus-visible {
  outline: 2px solid var(--text-primary);
  outline-offset: 4px;
}
.health-summary-card > a:active { transform: scale(.98); }
.health-summary-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}
.health-summary-title > svg { flex-shrink: 0; }
.health-summary-title > svg:last-child { margin-left: auto; }
.health-summary-value {
  display: block;
  margin-top: 16px;
  font-size: 40px;
  line-height: 1.1;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: -.03em;
}
.health-summary-value small {
  font-size: 17px;
  letter-spacing: 0;
  margin-left: 3px;
}
.health-summary-label {
  margin-top: 7px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-secondary);
}
.health-summary .health-reminder-button {
  width: 44px;
  height: 44px;
  padding: 0;
  flex-shrink: 0;
  justify-content: center;
}
.health-summary .health-reminder-button > span {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.health-summary .health-overview-heading { margin-bottom: 4px; }
.health-summary .health-overview-heading h2 { margin: 0; }
.health-summary .health-source-bar { margin-bottom: 12px; }
.health-detail-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}
.health-back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  background: none;
  border: 0;
  padding: 0 8px 0 0;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
}
.health-detail .health-overview-heading h1 {
  margin: 0 0 8px;
  font-size: 32px;
  line-height: 1.15;
  letter-spacing: -.03em;
  font-weight: 600;
}
.health-detail-cards { display: block; }
.health-detail-cards > article { width: 100%; }
.health-detail-cards .health-card:not(.health-body-card) > dl {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 28px 0;
}
@media (hover: hover) {
  .health-summary-card > a:hover { background-color: #00000006; }
}
@media (max-width: 760px) {
  .health-summary { margin: 16px 0 28px; }
  .health-summary .health-overview-heading { align-items: center; gap: 8px; }
  .health-summary .health-overview-heading h2 {
    font-size: 20px;
    line-height: 1.25;
    max-width: none;
  }
  .health-summary .health-source-bar {
    flex-wrap: nowrap;
    gap: 6px;
    font-size: 11px;
    margin-bottom: 10px;
    min-height: 44px;
  }
  .health-summary .health-source-bar > span:nth-child(2) {
    flex-basis: auto;
    line-height: 1.4;
  }
  .health-summary .health-source-bar > button {
    margin: 0;
    font-size: 11px;
    flex-shrink: 0;
    padding: 8px 5px;
  }
  .health-summary .health-source-bar > button:last-child { min-width: 44px; }
  .health-summary-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .health-summary-card { border-radius: 20px; }
  .health-summary-card > a { min-height: 122px; padding: 14px 16px; }
  .health-summary-title { font-size: 12px; gap: 6px; }
  .health-summary-title > svg:first-child { width: 16px; height: 16px; }
  .health-summary-title > svg:last-child { width: 13px; height: 13px; }
  .health-summary-value { font-size: 36px; margin-top: 12px; }
  .health-summary-value small { font-size: 15px; }
  .health-summary-label { margin-top: 4px; font-size: 11px; }
  .health-detail { margin-top: 8px; }
  .health-detail-navigation { gap: 8px; margin-bottom: 20px; }
  .health-detail-navigation .date-control { font-size: 11px; padding: 0 10px; }
  .health-back-button { font-size: 12px; }
  .health-detail .health-overview-heading h1 { font-size: 28px; }
  .health-detail-cards .health-card:not(.health-body-card) > dl { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 375px) {
  .health-summary .health-overview-heading h2 { font-size: 18px; }
  .health-summary-card > a { padding: 12px; }
  .health-summary-title { gap: 5px; }
  .health-summary-value { font-size: 32px; }
}
@media (max-width: 340px) {
  .health-summary-title > svg:first-child { display: none; }
  .health-summary-value { font-size: 30px; }
  .health-summary .health-source-bar > span:nth-child(2) { font-size: 10px; }
}

```

#### src/app/api/health/stool/route.ts

```ts
import { NextResponse } from "next/server";
// PoopCheck's public site does not publish an endpoint/auth contract. Do not
// transmit sensitive photos to a guessed endpoint or substitute a general model.
export async function GET() {
  return NextResponse.json(
    {
      configured: false,
      provider: "PoopCheck",
      message:
        "Photo analysis isn’t connected yet. Choose a Bristol type to log manually.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

```

#### tests/health-summary.spec.ts

```ts
import { test, expect, type Page } from "@playwright/test";

const signals = {
  connected: true, configured: true, recovery: 78, spo2: 97.2,
  respiratoryRate: 15.2, restingHeartRate: 56, hrv: 62.4,
  sleepHours: 7.6, sleepPerformance: 91, strain: 10.4,
  steps: 6543, skinTemperature: 33.4, workoutCount: 1, energyKcal: 1874,
};
async function openHome(page: Page, connected = true) {
  await page.route("**/api/whoop/metrics?**", (route) => route.fulfill({ json: {
    ...(connected ? signals : { connected: false, configured: false }),
    date: new URL(route.request().url()).searchParams.get("date"),
  } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the sample journal" }).click();
}

test("all four compact health cards fit above mobile navigation with one value each", async ({ page }) => {
  await page.setViewportSize({ width: 425, height: 851 });
  await openHome(page);
  const overview = page.getByRole("region", { name: "Your health overview" });
  await expect(overview.getByRole("article")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Overall body details" })).toContainText("78%");
  await expect(page.getByRole("link", { name: "Blood health details" })).toContainText("97.2%");
  await expect(page.getByRole("link", { name: "Lung details" })).toContainText("15.2/min");
  await expect(page.getByRole("link", { name: "Gut details" })).toContainText("Daily check-in");
  await expect(overview.locator(".health-summary-value")).toHaveCount(4);
  await expect(overview.getByText("Resting heart rate", { exact: true })).toHaveCount(0);
  for (const [width, height] of [[320, 851], [375, 812], [425, 851]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    expect(await page.evaluate(() => scrollY)).toBe(0);
    const grid = (await page.locator(".health-summary-cards").boundingBox())!;
    const nav = (await page.locator(".bottom-nav").boundingBox())!;
    expect(grid.y).toBeGreaterThan(0);
    expect(grid.y + grid.height).toBeLessThanOrEqual(nav.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.impeccable/review/compact-health-home-${width}.png` });
  }
});

test("each card opens its own detail page and browser back returns home", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openHome(page);
  for (const [name, key, label, reading] of [
    ["Overall body", "body", "Daily strain", "10.4"],
    ["Blood health", "blood", "Resting heart rate", "56"],
    ["Gut", "gut", "Latest Bristol type", "—"],
    ["Lung", "lung", "Sleep performance", "91"],
  ]) {
    await page.getByRole("link", { name: `${name} details` }).click();
    await expect(page).toHaveURL(new RegExp(`#health-${key}$`));
    await expect(page.getByRole("heading", { name, exact: true, level: 1 })).toBeFocused();
    const detail = page.getByRole("region", { name: `${name} details` });
    await expect(detail.getByRole("article")).toHaveCount(1);
    await expect(detail.locator(".health-metric").filter({ has: page.locator("dt", { hasText: label }) }).first()).toContainText(reading);
    await expect(page.getByRole("button", { name: "Today", exact: true })).toHaveClass(/selected/);
    await page.screenshot({ path: `.impeccable/review/health-detail-${key}.png`, fullPage: true });
    await page.goBack();
    await expect(page.getByRole("region", { name: "Your health overview" })).toBeVisible();
    await expect(page.locator(".health-summary-card")).toHaveCount(4);
  }
});

test("gut percentage tracks completion and WHOOP gaps remain blank", async ({ page }) => {
  await page.setViewportSize({ width: 425, height: 851 });
  await openHome(page, false);
  await expect(page.getByRole("link", { name: "Overall body details" })).toContainText("—");
  await expect(page.getByRole("link", { name: "Blood health details" })).toContainText("—");
  await expect(page.getByRole("link", { name: "Lung details" })).toContainText("—");
  await expect(page.getByRole("link", { name: "Gut details" })).toContainText("0%");
  await page.getByRole("link", { name: "Gut details" }).click();
  await expect(page.getByText(/not a gut health score/)).toBeVisible();
  await page.getByRole("button", { name: "Log a gut check-in" }).click();
  const dialog = page.getByRole("dialog", { name: "Gut check-in", exact: true });
  await dialog.getByRole("radio", { name: /4 Smooth and soft/ }).check();
  await dialog.getByLabel("Bowel comfort").selectOption("comfortable");
  await dialog.getByRole("button", { name: "Save gut check-in" }).click();
  await expect(page.getByRole("article", { name: "Gut", exact: true })).toContainText("Type 4");
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.getByRole("link", { name: "Gut details" })).toContainText("100%");
  await page.getByRole("link", { name: "Overall body details" }).click();
  await page.getByRole("button", { name: "Morning check-in", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Morning check-in", exact: true })).toBeVisible();
});

```

#### tests/health.spec.ts

```ts
import { test, expect } from "@playwright/test";
const metrics = {
  configured: true,
  connected: true,
  fetchedAt: "2026-11-23T02:00:00Z",
  recovery: 78,
  hrv: 62.4,
  restingHeartRate: 56,
  spo2: 97.2,
  skinTemperature: 33.4,
  respiratoryRate: 15.2,
  sleepHours: 7.6,
  sleepPerformance: 91,
  strain: 10.4,
  steps: 6543,
  energyKcal: 1874,
  workoutCount: 1,
  workoutMinutes: 42,
};
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() =>
    sessionStorage.setItem("form-sample", "true"),
  );
});

test("home separates WHOOP signals and manual gut logs in four cards", async ({
  page,
}) => {
  await page.route("**/api/whoop/metrics?**", (route) =>
    route.fulfill({
      json: {
        ...metrics,
        date: new URL(route.request().url()).searchParams.get("date"),
      },
    }),
  );
  await page.goto("/");
  const overview = page.getByRole("region", { name: "Your health overview" });
  await expect(overview.getByRole("article")).toHaveCount(4);
  await expect(
    page.getByRole("article", { name: "Blood health", exact: true }),
  ).toContainText("97.2");
  await expect(
    page.getByRole("article", { name: "Lung", exact: true }),
  ).toContainText("15.2");
  await expect(
    page.getByRole("article", { name: "Overall body", exact: true }),
  ).toContainText("78");
  await expect(
    page.getByRole("article", { name: "Gut", exact: true }),
  ).toContainText("Not measured by WHOOP");
  const body = await page
    .getByRole("article", { name: "Overall body", exact: true })
    .boundingBox();
  const blood = await page
    .getByRole("article", { name: "Blood health", exact: true })
    .boundingBox();
  expect(body!.width).toBeGreaterThan(blood!.width * 2);
  await page.screenshot({
    path: ".impeccable/review/health-home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 425, height: 851 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: ".impeccable/review/health-home-mobile.png",
    fullPage: true,
  });
});

test("scale photo prefills a draft, requires confirmation, converts pounds and saves only the number", async ({
  page,
}) => {
  await page.route("**/api/health/scale", (route) =>
    route.fulfill({
      json: { weight: 158.7, unit: "lb", needsConfirmation: true },
    }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Morning check-in", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Morning check-in",
    exact: true,
  });
  await dialog.getByLabel("Scale photo", { exact: true }).setInputFiles({
    name: "scale.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9uoAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    dialog.getByRole("button", { name: "Read weight from photo" }),
  ).toBeEnabled();
  await dialog.getByLabel(/Allow this photo to be sent/).check();
  await dialog.getByRole("button", { name: "Read weight from photo" }).click();
  await expect(dialog.getByLabel(/Scale reading/)).toHaveValue("158.7");
  await expect(dialog.getByLabel("Weight unit")).toHaveValue("lb");
  await dialog.getByRole("button", { name: "Send check-in" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("I checked the weight and unit.").check();
  await dialog.getByLabel(/After using the bathroom/).check();
  await dialog.getByLabel("Morning notes · optional").fill("A steady morning");
  await dialog.getByRole("button", { name: "Send check-in" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("article", { name: "Overall body", exact: true }),
  ).toContainText("72.0 kg");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("form-journal-v1") || "{}",
          ).weights?.at(-1)?.notes,
      ),
    )
    .toBe("A steady morning");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("form-journal-v1") || "{}").weights.at(-1),
  );
  expect(saved).toMatchObject({
    weight: "72.0",
    loss: "0.2",
    source: "photo",
    afterBathroom: true,
  });
  expect(JSON.stringify(saved)).not.toContain("base64");
  await page.reload();
  await expect(
    page.getByRole("article", { name: "Overall body", exact: true }),
  ).toContainText("72.0 kg");
});

test("manual stool tracking persists in the gut card without sending photos", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Log a gut check-in" }).click();
  const dialog = page.getByRole("dialog", {
    name: "Gut check-in",
    exact: true,
  });
  await dialog.getByRole("radio", { name: /4 Smooth and soft/ }).check();
  await dialog.getByLabel("Bowel comfort").selectOption("comfortable");
  await dialog.getByLabel("Gut notes · optional").fill("No discomfort");
  await dialog.getByRole("button", { name: "Save gut check-in" }).click();
  await expect(
    page.getByRole("article", { name: "Gut", exact: true }),
  ).toContainText("Type 4");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("form-journal-v1") || "{}")
            .stools?.[0]?.notes,
      ),
    )
    .toBe("No discomfort");
  await page.reload();
  await expect(
    page.getByRole("article", { name: "Gut", exact: true }),
  ).toContainText("Type 4");
});

test("missing WHOOP data stays blank and reminder copy is selectable", async ({
  page,
  request,
  baseURL,
}) => {
  await page.route("**/api/whoop/metrics?**", (route) =>
    route.fulfill({
      json: {
        date: new URL(route.request().url()).searchParams.get("date"),
        connected: false,
        configured: false,
      },
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("article", { name: "Blood health", exact: true }),
  ).toContainText("—");
  await page.getByRole("button", { name: "Morning reminders" }).click();
  const dialog = page.getByRole("dialog", { name: "Your morning nudge" });
  await expect(dialog).toContainText("Morning mission: step, snap, done.");
  await dialog.getByRole("radio", { name: "A little bathroom humour" }).check();
  await expect(dialog).toContainText(
    "Bathroom business done? Scale selfie next.",
  );
  await expect(dialog.getByLabel("Reminder time zone")).toHaveValue(
    "Asia/Kolkata",
  );
  await page.screenshot({
    path: ".impeccable/review/morning-reminder-settings.png",
    fullPage: true,
  });
  const scale = await request.post("/api/health/scale", {
    headers: { Origin: baseURL! },
  });
  expect(scale.status()).toBe(503);
  const push = await request.post("/api/reminders", {
    headers: { Origin: baseURL! },
    data: {
      time: "07:30",
      timezone: "Asia/Kolkata",
      tone: "friendly",
      subscription: { endpoint: "http://127.0.0.1/private" },
    },
  });
  expect(push.status()).toBe(400);
  const run = await request.post("/api/reminders/run");
  expect(run.status()).toBe(401);
});

test("on-device OCR fills a clear scale reading without uploading the photo", async ({
  page,
}) => {
  test.setTimeout(60000);
  let uploads = 0;
  page.on("request", (request) => {
    if (
      request.url().includes("/api/health/scale") &&
      request.method() === "POST"
    )
      uploads++;
  });
  await page.goto("/");
  const photo = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 260;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "white";
    context.fillRect(0, 0, 700, 260);
    context.fillStyle = "black";
    context.font = "bold 130px Arial";
    context.fillText("72.5 kg", 60, 180);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page
    .getByRole("button", { name: "Morning check-in", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Morning check-in",
    exact: true,
  });
  await dialog.getByLabel("Scale photo", { exact: true }).setInputFiles({
    name: "test-scale-display.png",
    mimeType: "image/png",
    buffer: Buffer.from(photo, "base64"),
  });
  await dialog.getByRole("button", { name: "Read weight from photo" }).click();
  await expect(dialog.getByLabel(/Scale reading/)).toHaveValue("72.5", {
    timeout: 45000,
  });
  expect(uploads).toBe(0);
  await expect(
    dialog.getByLabel("I checked the weight and unit."),
  ).not.toBeChecked();
  await page.screenshot({
    path: ".impeccable/review/scale-photo-review.png",
    fullPage: true,
  });
});

test("a declined notification permission has a friendly recovery state", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Notification, "requestPermission", {
      value: async () => "denied",
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Morning reminders" }).click();
  const dialog = page.getByRole("dialog", { name: "Your morning nudge" });
  await dialog.getByRole("button", { name: "Enable daily reminder" }).click();
  await expect(dialog.getByRole("status")).toContainText(
    "Notifications are off",
  );
});

test("morning notification deep link opens the weight form", async ({
  page,
}) => {
  await page.goto("/#morning");
  await expect(
    page.getByRole("dialog", { name: "Morning check-in", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL(/#overview$/);
});

test("opt-in reminder saves the chosen time zone and mood without sending a test notification", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Notification, "requestPermission", {
      value: async () => "granted",
    });
    const subscription = {
      toJSON: () => ({
        endpoint: "https://fcm.googleapis.com/fcm/send/test-only",
        keys: { p256dh: "test", auth: "test" },
      }),
    };
    const registration = {
      pushManager: {
        getSubscription: async () => null,
        subscribe: async () => subscription,
      },
    };
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: async () => registration,
        ready: Promise.resolve(registration),
      },
    });
  });
  let captured: { time?: string; timezone?: string; tone?: string } | null =
    null;
  await page.route("**/api/reminders", (route) =>
    route.request().method() === "POST"
      ? ((captured = route.request().postDataJSON()),
        route.fulfill({ json: { enabled: true } }))
      : route.continue(),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Morning reminders" }).click();
  const dialog = page.getByRole("dialog", { name: "Your morning nudge" });
  await dialog.getByLabel(/Remind me at/).fill("08:15");
  await dialog.getByRole("radio", { name: "A little bathroom humour" }).check();
  await dialog.getByRole("button", { name: "Enable daily reminder" }).click();
  await expect(
    dialog.getByRole("button", { name: "Save reminder changes" }),
  ).toBeVisible();
  expect(captured).toMatchObject({
    time: "08:15",
    timezone: "Asia/Kolkata",
    tone: "playful",
  });
});

```
