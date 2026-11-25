import { useState } from "react";
import { formatDate } from "@/lib/model";

type Reading = { date: string; value: number };

export default function RecoveryBarChart({ history, sample }: { history: Reading[]; sample: boolean }) {
  const [inspectedDate, setInspectedDate] = useState<string | null>(null);
  const inspectedIndex = history.findIndex(point => point.date === inspectedDate);
  const activeIndex = inspectedIndex < 0 ? history.length - 1 : inspectedIndex;
  const active = history[activeIndex];
  // Reference proportions: 1 bar-width followed by a 1.1 bar-width gutter.
  const spacingUnits = history.length + (history.length - 1) * 1.1;
  const percentage = (value: number) => Math.min(100, Math.max(0, value));
  const dateLabel = (date: string) => formatDate(date, { month: "short", day: "numeric" });

  return <span
    className="recovery-bar-chart"
    role="img"
    aria-label={`${sample ? "Sample recovery" : "Recovery"} graph: ${history.map(point => `${point.date}: ${point.value}%`).join(", ")}`}
    data-inspecting={inspectedIndex >= 0}
    onPointerLeave={() => setInspectedDate(null)}
  >
    <span className="recovery-chart-plot" style={{ columnGap: `${110 / spacingUnits}%` }} onPointerMove={event => {
      const box = event.currentTarget.getBoundingClientRect();
      const position = (event.clientX - box.left) / box.width * spacingUnits;
      const index = Math.max(0, Math.min(history.length - 1, Math.floor((position + .55) / 2.1)));
      setInspectedDate(history[index].date);
    }}>
      {history.map((point, index) => <span
        key={point.date}
        className={`recovery-chart-bar ${index === activeIndex ? "is-active" : ""}`}
        style={{ height: `${Math.max(2, percentage(point.value))}%`, flexBasis: `${100 / spacingUnits}%` }}
        title={`${dateLabel(point.date)}: ${point.value}% recovery`}
        aria-hidden="true"
      />)}
      <span className="recovery-chart-tooltip" aria-hidden="true" style={{
        left: `clamp(34px, ${(activeIndex * 2.1 + .5) / spacingUnits * 100}%, calc(100% - 34px))`,
        bottom: `min(calc(${percentage(active.value)}% + 7px), calc(100% - 2px))`,
      }}>
        <strong>{Math.round(active.value)}% recovery</strong>
        <span>{dateLabel(active.date)}</span>
      </span>
    </span>
    <span className="recovery-chart-y-labels" aria-hidden="true"><span>100</span><span>50</span><span>0</span></span>
    <span className="recovery-chart-x-labels" aria-hidden="true">
      {[0, Math.floor((history.length - 1) / 2), history.length - 1]
        .filter((index, position, all) => all.indexOf(index) === position)
        .map(index => <span key={history[index].date}>{dateLabel(history[index].date)}</span>)}
    </span>
  </span>;
}
