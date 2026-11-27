import type { HealthMetrics } from "@/lib/health";
import RecoveryBarChart from "./recovery-bar-chart";

export default function RecoveryCard({ health, sample, onOpen }: { health: HealthMetrics; sample: boolean; onOpen: () => void }) {
  const recovery = health.recovery != null && Number.isFinite(health.recovery) ? health.recovery : null;
  const recent = (health.recoveryHistory ?? (recovery == null ? [] : [{ date: health.date, value: recovery }]))
    .filter(point => point.date <= health.date && Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-24);
  // Show actual readings spaced across the same period, preserving both ends.
  const history = recent.length <= 12 ? recent : Array.from({ length: 12 }, (_, index) =>
    recent[Math.round(index * (recent.length - 1) / 11)],
  );
  const change = health.hrv != null && health.hrvBaseline != null && health.hrvBaseline > 0
    ? Math.round((health.hrv - health.hrvBaseline) / health.hrvBaseline * 100)
    : null;
  const score = recovery == null ? "—" : Math.round(recovery).toString();

  return <>
    <a className="recovery-card-details" href="#health-body" aria-label="Overall body details" onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault(); onOpen();
    }}>
    <span className="recovery-card-heading">
      <span>Recovery</span>
      <span className="recovery-card-badge">{sample ? "High" : recovery == null ? "No data" : "WHOOP"}</span>
    </span>
    <span className="health-summary-value recovery-card-score">
      <span>{score}</span>{recovery != null && <small>%</small>}
    </span>
    </a>
    <span className="recovery-card-chart">
      {history.length ? <RecoveryBarChart history={history} sample={sample} /> : <span className="recovery-chart-empty">Your recovery trend will appear here.</span>}
    </span>
    <span className="recovery-card-footer">
      <span>HRV <strong>{health.hrv == null ? "—" : health.hrv.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong>{health.hrv != null && <span className="recovery-card-unit"> ms</span>}</span>
      {change != null && <span className="recovery-card-baseline">· {change > 0 ? "+" : ""}{change}% vs base</span>}
    </span>
  </>;
}
