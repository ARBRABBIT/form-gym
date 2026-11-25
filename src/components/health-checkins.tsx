"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, Camera, Check, ImagePlus, RotateCcw } from "./icons";
import { Button, Field, Sheet, TextArea } from "./ui";
import DatePicker from "./date-picker";
import { dateKey, uid } from "@/lib/model";
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
    <Sheet title="Your morning nudge" onClose={onClose} className="reminder-sheet">
      <div className="health-sheet">
        <div className="reminder-intro">
          <span className="reminder-bell"><Bell size={26} /></span>
          <p className="health-intro">A friendly reminder. Always your choice.</p>
        </div>
        <div className="reminder-schedule">
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
        </div>
        <fieldset className="reminder-tone">
          <legend>Choose the mood</legend>
          <label className={settings.tone === "friendly" ? "selected" : ""}>
            <input
              type="radio"
              name="reminder-tone"
              checked={settings.tone === "friendly"}
              onChange={() => setSettings((s) => ({ ...s, tone: "friendly" }))}
            />
            Friendly & discreet
          </label>
          <label className={settings.tone === "playful" ? "selected" : ""}>
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
          <div className="reminder-preview-title"><Bell size={16} /><strong>Form · Morning check-in</strong></div>
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
