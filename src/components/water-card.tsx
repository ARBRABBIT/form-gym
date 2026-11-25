"use client";

import { useId, type CSSProperties } from "react";
import { ArrowUpRight, Droplet, Minus, Plus } from "./icons";

export default function WaterCard({ liters, onChange, onOpen }: { liters: number; onChange: (liters: number) => void; onOpen: () => void }) {
  const id = useId();
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
            return <button key={index} type="button" aria-label={`Set water to ${index + 1} liter${index ? "s" : ""}`} aria-pressed={liters >= index + 1}
              onClick={() => change(liters === index + 1 ? index : index + 1)}>
              <svg viewBox="0 0 32 40" aria-hidden="true">
                <defs><clipPath id={`${id}-glass-${index}`}><path d="M5 5H27L23 35H9Z" /></clipPath></defs>
                <rect x="4" y={35 - fill * 30} width="24" height={fill * 30} clipPath={`url(#${id}-glass-${index})`} className="water-glass-fill" />
                <path d="M5 5H27L23 35H9Z" className="water-glass-outline" />
              </svg>
            </button>;
          })}
        </div>
        <p className="water-card-label">Water intake</p>
        <div className="water-card-bottom">
          <p className="water-card-reading" role="status" aria-live="polite" aria-atomic="true"><span>{liters.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span><span> L</span></p>
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
