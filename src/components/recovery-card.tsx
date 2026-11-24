import type { HealthMetrics } from "@/lib/health";

export default function RecoveryCard({ health, sample }: { health: HealthMetrics; sample: boolean }) {
  const recovery = health.recovery != null && Number.isFinite(health.recovery) ? health.recovery : null;
  const history = (health.recoveryHistory ?? (recovery == null ? [] : [{ date: health.date, value: recovery }]))
    .filter(point => point.date <= health.date && Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-28);
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
      {history.length ? <svg viewBox="0 0 280 152" preserveAspectRatio="none" role="img" aria-label={`${sample ? "Sample recovery" : "Recovery"} graph: ${history.map(point => `${point.date}: ${point.value}%`).join(", ")}`}>
        {history.map((point, index) => {
          const rows = Math.round(Math.min(100, Math.max(0, point.value)) / 100 * 14);
          // Two larger dot columns per group, retaining the gutters between bars.
          const column = 28 - history.length + index;
          const x = 4.35 + Math.floor(column / 2) * 20 + (column % 2) * 6.5;
          return <g key={point.date} opacity={index >= history.length - 6 ? .95 : .72}>
            <title>{point.date}: {point.value}% recovery</title>
            {Array.from({ length: rows }, (_, row) => (
              <rect key={row} x={x} y={146 - row * 10} width="4.8" height="4.8" rx=".4" fill="currentColor" stroke="currentColor" strokeWidth=".25" vectorEffect="non-scaling-stroke" opacity={1 - row / 14 * .25} />
            ))}
          </g>;
        })}
      </svg> : <span className="recovery-chart-empty">Your recovery trend will appear here.</span>}
    </span>
    <span className="recovery-card-footer">
      <span>HRV <strong>{health.hrv == null ? "—" : health.hrv.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong>{health.hrv != null && <span className="recovery-card-unit"> ms</span>}</span>
      {change != null && <span className="recovery-card-baseline">· {change > 0 ? "+" : ""}{change}% vs base</span>}
    </span>
  </>;
}
