import type { HealthMetrics } from "@/lib/health";
import RecoveryBarChart from "./recovery-bar-chart";

export default function RecoveryCard({ health, sample }: { health: HealthMetrics; sample: boolean }) {
  const recovery = health.recovery != null && Number.isFinite(health.recovery) ? health.recovery : null;
  const history = (health.recoveryHistory ?? (recovery == null ? [] : [{ date: health.date, value: recovery }]))
    .filter(point => point.date <= health.date && Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-24);
  const change = health.hrv != null && health.hrvBaseline != null && health.hrvBaseline > 0
    ? Math.round((health.hrv - health.hrvBaseline) / health.hrvBaseline * 100)
    : null;
  const score = recovery == null ? "—" : Math.round(recovery).toString();

  return <>
    <span className="recovery-card-heading">
      <span>Recovery</span>
      <span className="recovery-card-badge">{sample ? "High" : recovery == null ? "No data" : "WHOOP"}</span>
    </span>
    <span className="health-summary-value recovery-card-score">
      <span>{score}</span>{recovery != null && <small>%</small>}
    </span>
    <span className="recovery-card-chart">
      {history.length ? <RecoveryBarChart history={history} sample={sample} /> : <span className="recovery-chart-empty">Your recovery trend will appear here.</span>}
    </span>
    <span className="recovery-card-footer">
      <span>HRV <strong>{health.hrv == null ? "—" : health.hrv.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong>{health.hrv != null && <span className="recovery-card-unit"> ms</span>}</span>
      {change != null && <span className="recovery-card-baseline">· {change > 0 ? "+" : ""}{change}% vs base</span>}
    </span>
  </>;
}
