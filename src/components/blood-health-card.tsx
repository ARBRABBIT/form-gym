import { useId, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "./icons";
import type { HealthMetrics } from "@/lib/health";
import { ChartReadingPopup, ChartReadingTargets, useChartReadingPopup } from "./chart-reading-popup";
import { formatDate } from "@/lib/model";

const shiftDate = (date: string, days: number) => {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
};
type Point = { x: number; y: number };
function smoothPath(points: Point[]) {
  if (points.length < 2) return "";
  return points.reduce((path, point, index) => {
    if (!index) return `M${point.x},${point.y}`;
    const before = points[Math.max(0, index - 2)];
    const previous = points[index - 1];
    const after = points[Math.min(points.length - 1, index + 1)];
    return `${path} C${previous.x + (point.x - before.x) / 6},${previous.y + (point.y - before.y) / 6} ${point.x - (after.x - previous.x) / 6},${point.y - (after.y - previous.y) / 6} ${point.x},${point.y}`;
  }, "");
}

export default function BloodHealthCard({ health, sample, onOpen }: {
  health: HealthMetrics;
  sample: boolean;
  onOpen: () => void;
}) {
  const popup = useChartReadingPopup();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const id = useId().replace(/:/g, "");
  const readings = (health.spo2History ?? (health.spo2 == null ? [] : [{ date: health.date, value: health.spo2 }]))
    .filter(point => point.date <= health.date && Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  const end = shiftDate(health.date, -weekOffset * 7);
  const start = shiftDate(end, -6);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(start, index);
    return { date, value: readings.find(point => point.date === date)?.value ?? null };
  });
  const valid = week.filter(point => point.value != null);
  const chosen = week.find(point => point.date === selectedDate && point.value != null)
    ?? (week[3].value != null ? week[3] : valid.at(-1));
  const values = valid.map(point => point.value!);
  const low = Math.min(...values) - .15;
  const high = Math.max(...values) + .15;
  const pointFor = (index: number): Point => ({ x: 20 + index * 40, y: 126 - (week[index].value! - low) / (high - low) * 100 });
  const segments: Point[][] = [];
  week.forEach((point, index) => {
    if (point.value == null) return;
    if (!index || week[index - 1].value == null) segments.push([]);
    segments[segments.length - 1].push(pointFor(index));
  });
  const selectedPoint = chosen ? pointFor(week.indexOf(chosen)) : null;
  const rangeLabel = `${formatDate(start, { month: "short", day: "numeric" })} – ${formatDate(end, { month: "short", day: "numeric" })}`;
  const changeWeek = (offset: number) => { setWeekOffset(offset); setSelectedDate(null); popup.close(); };

  return <div ref={popup.root} className="blood-card-inner">
    <a className="blood-card-link" href="#health-blood" aria-label="Blood health details" onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      onOpen();
    }}>
      <span className="blood-card-heading">Blood health<span className="blood-card-open"><ArrowUpRight aria-hidden="true" /></span></span>
      <span className="health-summary-value blood-card-value"><span className="blood-card-digits">{health.spo2 == null ? "—" : health.spo2.toFixed(1)}</span>{health.spo2 != null && <small>%</small>}<span className="blood-card-reading-label">Latest blood oxygen</span></span>
    </a>
    <div className="blood-card-plot">
      {valid.length ? <>
        <svg viewBox="0 0 280 150" preserveAspectRatio="none" role="img" aria-label={`${sample ? "Sample blood oxygen" : "Blood oxygen"} profile, ${rangeLabel}: ${valid.map(point => `${point.date}: ${point.value}%`).join(", ")}`}>
          <defs>
            <clipPath id={`${id}-focus`}><rect x={Math.max(0, (selectedPoint?.x ?? 140) - 56)} y="0" width="112" height="150" /></clipPath>
            <linearGradient id={`${id}-line`}><stop offset="0" stopColor="#fff" stopOpacity=".25" /><stop offset=".35" stopColor="#fff" /><stop offset=".65" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity=".25" /></linearGradient>
          </defs>
          <path d="M0 80H280 M0 126H280" className="blood-card-grid" />
          {segments.map((points, index) => <g key={index}>
            <path d={smoothPath(points)} className="blood-card-curve blood-card-curve-dotted" />
            <path d={smoothPath(points)} className="blood-card-curve" stroke={`url(#${id}-line)`} clipPath={`url(#${id}-focus)`} />
          </g>)}
          {selectedPoint && <path d={`M${selectedPoint.x} ${selectedPoint.y}V126`} className="blood-card-guide" />}
        </svg>
        {selectedPoint && <span className="blood-card-marker" style={{ left: `${selectedPoint.x / 280 * 100}%`, top: `${selectedPoint.y / 150 * 100}%` }} aria-hidden="true"><span /></span>}
        <ChartReadingTargets readings={week} selectedDate={chosen?.date} popupDate={popup.selection?.date} tooltipId={popup.id} label="Blood oxygen"
          onSelect={(point, anchor) => { setSelectedDate(point.date); popup.open(point, anchor); }} />
      </> : <span className="blood-card-empty">Your weekly blood oxygen profile will appear here.</span>}
    </div>
    <div className="blood-card-days" role="group" aria-label="Blood oxygen readings">
      {week.map(day => <button type="button" key={day.date} disabled={day.value == null} aria-pressed={chosen?.date === day.date} aria-label={`${formatDate(day.date)}${day.value == null ? ", no reading" : `, blood oxygen ${day.value}%`}`} aria-describedby={popup.selection?.date === day.date ? popup.id : undefined} onClick={event => { setSelectedDate(day.date); popup.open(day, event.currentTarget); }}>
        <span>{formatDate(day.date, { weekday: "short" }).slice(0, 1)}</span>
      </button>)}
    </div>
    <div className="blood-card-week">
      <button type="button" aria-label="Previous blood health week" disabled={!readings.length || start <= readings[0].date} onClick={() => changeWeek(weekOffset + 1)}><ChevronLeft aria-hidden="true" /></button>
      <span aria-live="polite">{rangeLabel}</span>
      <button type="button" aria-label="Next blood health week" disabled={weekOffset === 0} onClick={() => changeWeek(weekOffset - 1)}><ChevronRight aria-hidden="true" /></button>
    </div>
    <ChartReadingPopup id={popup.id} selection={popup.selection} unit="% SpO₂" tone="blood" />
  </div>;
}
