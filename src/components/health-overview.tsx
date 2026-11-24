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
  RefreshCw,
  Scale,
  Watch,
  Wind,
} from "lucide-react";
import { emptyHealth, sampleHealth, type HealthMetrics } from "@/lib/health";
import { dateKey, formatDate } from "@/lib/model";
import type { ScreenProps } from "./journal-app";
import { Button, Sheet } from "./ui";
import DatePicker from "./date-picker";
import WearableConnect from "./wearable-connect";
import RecoveryCard from "./recovery-card";
import {
  MorningCheckIn,
  MorningReminders,
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
export type HealthSection = "body" | "blood" | "lung";
const sectionNames: Record<HealthSection, string> = {
  body: "Overall body", blood: "Blood health", lung: "Lung",
};
export default function HealthOverview(p: ScreenProps & { detail?: HealthSection }) {
  const [health, setHealth] = useState<HealthMetrics>(() =>
      emptyHealth(p.date),
    ),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0),
    [dialog, setDialog] = useState<
      "weight" | "reminders" | "whoop" | null
    >(null);
  useEffect(() => {
    if (location.hash === "#morning") setDialog("weight");
  }, []);
  useEffect(() => {
    if (p.data.sampleData) {
      setHealth(sampleHealth(p.date));
      setLoading(false);
      setError("");
      return;
    }
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
  }, [p.date, refresh, p.data.sampleData]);
  const close = useCallback(() => {
    setDialog(null);
    if (location.hash === "#morning") p.navigate("overview");
  }, [p.navigate]);
  const currentHealth = health.date === p.date ? health : emptyHealth(p.date);
  const weight = [...p.data.weights]
    .reverse()
    .filter((item) => item.date <= p.date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
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
      {!p.detail && p.data.sampleData && <p className="health-preview-label">Sample data</p>}
      {p.detail && <div className="health-source-bar" role="status">
        <span
          className={`health-source-dot ${currentHealth.connected && !error ? "connected" : ""}`}
        />
        <span>
          {p.data.sampleData ? "Sample data · WHOOP preview" : !p.detail ? (loading ? "Syncing WHOOP…" : error ? "Sync unavailable" : currentHealth.connected ? "WHOOP connected" : "Not connected") : loading
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
      </div>}
      {!p.detail ? (
        <div className="health-summary-cards">
          {([
            { key: "body", title: "Overall body", icon: Activity, value: currentHealth.recovery, unit: "%", label: "Recovery", digits: 0 },
            { key: "blood", title: "Blood health", icon: Droplet, value: currentHealth.spo2, unit: "%", label: "Blood oxygen", digits: 1 },
            { key: "lung", title: "Lung", icon: Wind, value: currentHealth.respiratoryRate, unit: "/min", label: "Respiratory rate", digits: 1 },
          ] as const).map((card) => (
            <article key={card.key} className={`health-summary-card health-summary-${card.key}`} aria-label={card.title}>
              <a href={`#health-${card.key}`} aria-label={`${card.title} details`} onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                event.preventDefault();
                p.navigate(`health-${card.key}`);
              }}>
                {card.key === "body" ? <RecoveryCard health={currentHealth} sample={!!p.data.sampleData} /> : <>
                <span className="health-summary-title"><card.icon size={17} aria-hidden="true" /><span>{card.title}</span><ArrowUpRight size={15} aria-hidden="true" /></span>
                <span className="health-summary-value">{display(card.value, card.digits)}{card.value != null && <small>{card.unit}</small>}</span>
                <span className="health-summary-label">{card.label}</span>
                </>}
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
            <span className="health-source-label">{p.data.sampleData ? "Sample data + your check-ins" : "WHOOP + your check-ins"}</span>
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
            <span className="health-source-label">{p.data.sampleData ? "Sample data" : "WHOOP"}</span>
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
        {p.detail === "lung" && (
        <article className="health-card health-lung-card" aria-label="Lung">
          <header>
            <span className="health-card-title">
              <Wind size={20} />
              <h3>Lung</h3>
            </span>
            <span className="health-source-label">{p.data.sampleData ? "Sample data" : "WHOOP"}</span>
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
