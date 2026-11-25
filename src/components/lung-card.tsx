import type { HealthMetrics } from "@/lib/health";
import RespiratoryRateChart from "./respiratory-rate-chart";

export default function LungCard({ health }: { health: HealthMetrics }) {
  const rate = health.respiratoryRate != null && Number.isFinite(health.respiratoryRate) ? health.respiratoryRate : null;
  const baseline = health.respiratoryRateBaseline != null && Number.isFinite(health.respiratoryRateBaseline) && health.respiratoryRateBaseline > 0
    ? health.respiratoryRateBaseline : null;
  const change = rate != null && baseline != null
    ? Math.round((rate - baseline) / baseline * 100)
    : null;
  const reading = rate == null ? "—" : rate.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const comparison = change == null ? "Baseline comparison unavailable" : `${Math.abs(change)}% ${change > 0 ? "above" : change < 0 ? "below" : "change from"} respiratory rate baseline`;
  const history = (health.respiratoryRateHistory ?? [])
    .filter(point => point.date <= health.date && Number.isFinite(point.value) && point.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  return <>
    <span className="lung-card-heading">Lung</span>
    <span className="lung-card-content">
      <span className="health-summary-value lung-card-reading">
        <span className="lung-card-digits">{reading}</span>{rate != null && <small>/min</small>}
        <span className="lung-card-reflection" aria-hidden="true">{reading}</span>
      </span>
      <span className="lung-card-history">
        <RespiratoryRateChart history={history} />
        <span className="lung-card-baseline">
          <span>Baseline</span>
          <strong>{baseline == null ? "—" : baseline.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{baseline != null && <small> /min</small>}</strong>
        </span>
      </span>
      <span className="lung-card-trend">
        <span className="lung-card-comparison" role="img" aria-label={comparison} title={comparison}>
          {change != null && change !== 0 && <span aria-hidden="true">{change > 0 ? "↑" : "↓"}</span>}
          {change == null ? "—" : `${Math.abs(change)}%`}
        </span>
        <span className="lung-card-underline" aria-hidden="true" />
      </span>
    </span>
    <span className="lung-card-caption">Respiratory rate</span>
  </>;
}
