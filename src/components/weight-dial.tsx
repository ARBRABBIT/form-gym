"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Minus, Plus } from "lucide-react";

const point = (angle: number, radius: number) => ({
  x: 160 + Math.sin((angle * Math.PI) / 180) * radius,
  y: 153 - Math.cos((angle * Math.PI) / 180) * radius,
});

/** A touch dial and a decimal input share one optional weight value. */
export default function WeightDial({ value, onChange }: {
  value: string;
  onChange: (weight: string) => void;
}) {
  const id = useId();
  const number = Number(value);
  const selected = value.trim() !== "" && Number.isFinite(number) && number >= 1 && number <= 700;
  const min = selected && number < 20 ? 1 : 20;
  const max = selected && number > 200 ? 700 : 200;
  const current = selected ? number : 75;
  const progress = selected ? (current - min) / (max - min) : 0;
  const [dragging, setDragging] = useState(false);
  const set = (next: number) => onChange((Math.round(Math.max(min, Math.min(max, next)) * 10) / 10).toFixed(1));
  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 320 - 160;
    const y = ((event.clientY - bounds.top) / bounds.height) * 304 - 153;
    const angle = Math.atan2(x, -y) * 180 / Math.PI;
    set(min + ((Math.max(-135, Math.min(135, angle)) + 135) / 270) * (max - min));
  };
  const keyboard = (event: KeyboardEvent<SVGSVGElement>) => {
    const change = { ArrowRight: .1, ArrowUp: .1, ArrowLeft: -.1, ArrowDown: -.1, PageUp: 1, PageDown: -1 }[event.key];
    if (change !== undefined || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      set(event.key === "Home" ? min : event.key === "End" ? max : current + change!);
    }
  };
  return (
    <div className="weight-dial" data-dragging={dragging}>
      <div className="weight-dial-face">
        <svg viewBox="0 0 320 304" role="slider" tabIndex={0}
          aria-label="Weight dial" aria-valuemin={min} aria-valuemax={max}
          aria-valuenow={current} aria-valuetext={selected ? `${current.toFixed(1)} kilograms` : "No weight selected. Drag to choose your approximate weight."}
          aria-describedby={`${id}-hint`} onKeyDown={keyboard}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) * 320 - 160;
            const y = ((event.clientY - bounds.top) / bounds.height) * 304 - 153;
            if (Math.hypot(x, y) < 98) return;
            event.preventDefault();
            event.currentTarget.focus({ preventScroll: true });
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            pick(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) pick(event);
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            setDragging(false);
          }}
          onPointerCancel={() => setDragging(false)}
          onLostPointerCapture={() => setDragging(false)}>
          <title>Drag the arc to choose your weight</title>
          {Array.from({ length: 73 }, (_, index) => {
            const angle = -135 + index * 3.75;
            const outer = point(angle, 139);
            const inner = point(angle, index % 6 === 0 ? 115 : 122);
            const fine = point(angle, 103);
            const fineEnd = point(angle, 99);
            return <g key={index} aria-hidden="true">
              <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
                className={selected && index / 72 <= progress ? "weight-tick is-filled" : "weight-tick"}
                strokeWidth={index % 6 === 0 ? 3 : 2} />
              <line x1={fine.x} y1={fine.y} x2={fineEnd.x} y2={fineEnd.y} className="weight-tick-fine" strokeWidth="1" />
            </g>;
          })}
          {[min, (min + max) / 2, max].map((label, index) => {
            const position = point(-125 + index * 125, 83);
            return <text key={index} x={position.x} y={position.y + 4} className="weight-dial-label" textAnchor="middle" aria-hidden="true">{label}</text>;
          })}
          {selected && <g className="weight-dial-knob" style={{ transform: `rotate(${-135 + progress * 270}deg)`, transformOrigin: "160px 153px" }} aria-hidden="true">
            <circle cx="160" cy="14" r="9" fill="var(--accent-selection)" stroke="var(--text-primary)" strokeWidth="2" />
            <circle cx="160" cy="14" r="2" fill="var(--text-primary)" />
          </g>}
        </svg>
        <label className="weight-dial-input">
          <span className="sr-only">Approximate weight (kg)</span>
          <input type="number" aria-label="Approximate weight (kg)" inputMode="decimal" min="1" max="700" step="0.1"
            value={value} onChange={(event) => onChange(event.target.value)} placeholder="—" />
          <span aria-hidden="true">kg</span>
        </label>
      </div>
      <div className="weight-dial-adjust">
        <button type="button" aria-label="Decrease weight" onClick={() => set(selected ? current - .1 : 75)}><Minus size={18} /></button>
        <span>Approximate weight</span>
        <button type="button" aria-label="Increase weight" onClick={() => set(selected ? current + .1 : 75)}><Plus size={18} /></button>
      </div>
      <p id={`${id}-hint`} className="weight-dial-hint">Drag the dial or tap the number to type.</p>
    </div>
  );
}
