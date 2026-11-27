import { useEffect, useId, useRef, useState } from "react";
import { formatDate } from "@/lib/model";

type Reading = { date: string; value: number };

export default function RecoveryBarChart({ history, sample }: { history: Reading[]; sample: boolean }) {
  const [inspectedDate, setInspectedDate] = useState<string | null>(null);
  const root = useRef<HTMLSpanElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const tooltipId = useId();
  const inspectedIndex = history.findIndex(point => point.date === inspectedDate);
  const activeIndex = inspectedIndex < 0 ? history.length - 1 : inspectedIndex;
  const active = history[inspectedIndex];
  const percentage = (value: number) => Math.min(100, Math.max(0, value));
  const dateLabel = (date: string) => formatDate(date, { month: "short", day: "numeric" });

  useEffect(() => {
    if (!inspectedDate) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setInspectedDate(null);
    };
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, [inspectedDate]);

  return <span ref={root} className="recovery-bar-chart" role="group" aria-label={`${sample ? "Sample recovery" : "Recovery"} graph`}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInspectedDate(null); }}
    onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); setInspectedDate(null); }
    }}>
    <span className="recovery-chart-plot" style={{ gridTemplateColumns: `repeat(${history.length}, minmax(0, 1fr))` }}>
      {history.map((point, index) => <button key={point.date} ref={element => { buttons.current[index] = element; }}
        type="button" className="recovery-chart-hit" aria-label={`${dateLabel(point.date)}: ${Math.round(point.value)}% recovery`}
        aria-pressed={inspectedIndex === index} aria-describedby={inspectedIndex === index ? tooltipId : undefined}
        tabIndex={index === activeIndex ? 0 : -1}
        onClick={() => setInspectedDate(point.date)}
        onFocus={event => { if (event.currentTarget.matches(":focus-visible")) setInspectedDate(point.date); }}
        onKeyDown={event => {
          const next = event.key === "ArrowRight" ? Math.min(history.length - 1, index + 1)
            : event.key === "ArrowLeft" ? Math.max(0, index - 1)
            : event.key === "Home" ? 0 : event.key === "End" ? history.length - 1 : null;
          if (next == null) return;
          event.preventDefault(); setInspectedDate(history[next].date); buttons.current[next]?.focus();
        }}>
        <span className={`recovery-chart-bar ${index === activeIndex ? "is-active" : ""}`} aria-hidden="true"
          style={{ height: `${Math.max(2, percentage(point.value))}%` }} />
      </button>)}
    </span>
    {active && <span id={tooltipId} className="recovery-chart-tooltip" role="tooltip" style={{
      left: `clamp(min(62px, 50%), ${(inspectedIndex + .5) / history.length * 100}%, calc(100% - min(62px, 50%)))`,
      bottom: `clamp(0px, calc(${percentage(active.value)}% + 6px), max(0px, calc(100% - 40px)))`,
    }}>
      <strong>{Math.round(active.value)}% recovery</strong>
      <span>{dateLabel(active.date)}</span>
    </span>}
  </span>;
}
