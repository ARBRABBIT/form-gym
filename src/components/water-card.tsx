"use client";

import { useId, useRef, type CSSProperties } from "react";
import { useValueFeedback } from "@/lib/interaction-feedback";
import { ArrowUpRight, Droplet, Minus, Plus } from "./icons";

export default function WaterCard({ liters, onChange, onOpen }: { liters: number; onChange: (liters: number) => void; onOpen: () => void }) {
  const id = useId();
  const reading = useRef<HTMLParagraphElement>(null);
  useValueFeedback(reading, liters);
  const change = (next: number) => onChange(Math.max(0, Math.round(next * 1e6) / 1e6));
  return (
    <section className="water-intake-card" data-nav-tone="dark" aria-label="Water intake" style={{ "--water-level": `${18 + Math.min(liters, 6) / 6 * 55}%` } as CSSProperties}>
      <div className="water-liquid" aria-hidden="true">
        <svg className="water-wave water-wave-back" viewBox="0 0 1200 600" preserveAspectRatio="none"><path d="M0 90 Q150 10 300 90 T600 90 T900 90 T1200 90 V600 H0Z" /></svg>
        <svg className="water-wave water-wave-front" viewBox="0 0 1200 600" preserveAspectRatio="none">
          <defs><linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00738e" /><stop offset="55%" stopColor="#00627e" /><stop offset="100%" stopColor="#04485d" /></linearGradient></defs>
          <path d="M0 90 Q150 10 300 90 T600 90 T900 90 T1200 90 V600 H0Z" fill={`url(#${id}-water)`} />
        </svg>
      </div>
      <div className="water-card-content">
        <header className="water-card-heading"><h2><Droplet size={17} /> Water</h2><button type="button" className="water-card-open" aria-label="Open water tracker" onClick={onOpen}>Track water <ArrowUpRight size={14} /></button></header>
        <div className="water-glasses" aria-label="Daily water amount">
          {Array.from({ length: 6 }, (_, index) => {
            const fill = Math.max(0, Math.min(1, liters - index));
            const glassId = `${id}-glass-${index}`;
            const waterY = 34 - fill * 24;
            const shape = "M5 7Q16 10 27 7L23.5 34Q16 37 8.5 34Z";
            return <button key={index} type="button" aria-label={`Set water to ${index + 1} liter${index ? "s" : ""}`} aria-pressed={liters >= index + 1}
              onClick={() => change(liters === index + 1 ? index : index + 1)}>
              <svg viewBox="0 0 32 40" aria-hidden="true">
                <defs>
                  <clipPath id={`${glassId}-clip`}><path d={shape} /></clipPath>
                  <linearGradient id={`${glassId}-surface`}>
                    <stop stopColor="#fff" stopOpacity=".42" />
                    <stop offset=".22" stopColor="#dcf8f4" stopOpacity=".12" />
                    <stop offset=".55" stopColor="#fff" stopOpacity=".03" />
                    <stop offset=".82" stopColor="#d7cce8" stopOpacity=".18" />
                    <stop offset="1" stopColor="#fff" stopOpacity=".5" />
                  </linearGradient>
                  <linearGradient id={`${glassId}-water`} x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#e4fff7" stopOpacity=".78" />
                    <stop offset=".45" stopColor="#b1e2dc" stopOpacity=".55" />
                    <stop offset="1" stopColor="#97c9ce" stopOpacity=".28" />
                  </linearGradient>
                </defs>
                <path d={shape} fill={`url(#${glassId}-surface)`} />
                <g clipPath={`url(#${glassId}-clip)`}>
                  {fill > 0 && <>
                    <rect x="4" y={waterY} width="24" height={37 - waterY} fill={`url(#${glassId}-water)`} className="water-glass-fill" />
                    <ellipse cx="16" cy={waterY} rx="11" ry="1.7" className="water-glass-meniscus" />
                  </>}
                  <path d="M8 11 11 31" className="water-glass-reflection" />
                  <path d="M24.5 12 22 30" className="water-glass-reflection water-glass-reflection-soft" />
                </g>
                <path d={shape} className="water-glass-outline" />
                <ellipse cx="16" cy="7" rx="11" ry="2.5" className="water-glass-rim" />
                <path d="M11 34Q16 35.5 21 34" className="water-glass-base" />
              </svg>
            </button>;
          })}
        </div>
        <p className="water-card-label">Water intake</p>
        <div className="water-card-bottom">
          <p ref={reading} className="water-card-reading" role="status" aria-live="polite" aria-atomic="true"><span>{liters.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span><span> L</span></p>
          <div className="water-card-adjust">
            <button type="button" aria-label="Remove 250 ml" disabled={liters === 0} onClick={() => change(liters - .25)}><Minus size={18} /></button>
            <button type="button" aria-label="Add 250 ml" onClick={() => change(liters + .25)}><Plus size={18} /></button>
          </div>
        </div>
        <p className="water-card-caption">Each marker = 1 L · Today’s journal</p>
      </div>
    </section>
  );
}
