"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "@/lib/model";

type Reading = { date: string; value: number | null };
type Selection = { date: string; value: number; left: number; top: number; width: number };

export function useChartReadingPopup() {
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const [selection, setSelection] = useState<Selection | null>(null);
  const close = useCallback(() => setSelection(null), []);
  const open = useCallback((point: Reading, anchor: HTMLButtonElement) => {
    if (point.value == null || !Number.isFinite(point.value)) return;
    const box = anchor.getBoundingClientRect();
    const width = Math.min(144, innerWidth - 24);
    const left = Math.max(12, Math.min(innerWidth - width - 12, box.left + box.width / 2 - width / 2));
    const top = Math.max(8, box.top >= 60 ? box.top - 52 : Math.min(innerHeight - 52, box.bottom + 8));
    setSelection({ date: point.date, value: point.value, left, top, width });
  }, []);
  useEffect(() => {
    if (!selection) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !document.getElementById(id)?.contains(target)) close();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [selection, close, id]);
  return { root, id, selection, open, close };
}

export function ChartReadingPopup({ id, selection, unit, tone }: { id: string; selection: Selection | null; unit: "% SpO₂" | "/min"; tone: "blood" | "lung" }) {
  if (!selection) return null;
  return createPortal(<div id={id} role="tooltip" className={`chart-reading-popup chart-reading-popup-${tone}`} style={{ left: selection.left, top: selection.top, width: selection.width }}>
    <strong>{selection.value.toFixed(1)}{unit === "% SpO₂" ? unit : ` ${unit}`}</strong>
    <span>{formatDate(selection.date, { month: "short", day: "numeric" })}</span>
  </div>, document.body);
}

export function ChartReadingTargets({ readings, selectedDate, popupDate, tooltipId, label, onSelect, className = "" }: {
  readings: Reading[]; selectedDate?: string | null; popupDate?: string; tooltipId: string; label: string;
  onSelect: (point: Reading, anchor: HTMLButtonElement) => void; className?: string;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const available = readings.flatMap((point, index) => point.value != null ? [index] : []);
  const chosen = readings.findIndex(point => point.date === selectedDate && point.value != null);
  const tabIndex = chosen < 0 ? available.at(-1) : chosen;
  return <div role="group" aria-label={`${label} graph readings`} className={`chart-reading-targets ${className}`} style={{ gridTemplateColumns: `repeat(${readings.length}, minmax(0, 1fr))` }}>
    {readings.map((point, index) => <button key={point.date} ref={button => { buttons.current[index] = button; }} type="button" className="chart-reading-hit"
      disabled={point.value == null} tabIndex={index === tabIndex ? 0 : -1} aria-pressed={chosen === index}
      aria-label={`${label}, ${formatDate(point.date, { month: "short", day: "numeric" })}: ${point.value == null ? "no reading" : point.value.toFixed(1)}`}
      aria-describedby={point.date === popupDate ? tooltipId : undefined}
      onClick={event => onSelect(point, event.currentTarget)}
      onFocus={event => { if (event.currentTarget.matches(":focus-visible")) onSelect(point, event.currentTarget); }}
      onKeyDown={event => {
        const position = available.indexOf(index);
        const next = event.key === "Home" ? available[0] : event.key === "End" ? available.at(-1)
          : event.key === "ArrowRight" ? available[Math.min(position+1, available.length-1)]
          : event.key === "ArrowLeft" ? available[Math.max(0, position-1)] : undefined;
        if (next == null) return;
        event.preventDefault(); onSelect(readings[next], buttons.current[next]!); buttons.current[next]?.focus();
      }} />)}
  </div>;
}
