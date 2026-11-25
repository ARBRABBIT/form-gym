"use client";

import { useState } from "react";
import type { ScreenProps } from "./journal-app";
import { ArrowLeft, Minus, Plus } from "./icons";
import { emptyNutrition, formatDate } from "@/lib/model";
import DatePicker from "./date-picker";
import DrinkVessel from "./drink-vessel";

const ML_PER_OUNCE = 29.5735295625;
const servings = [
  { id: "glass", label: "Glass", ounces: 8 },
  { id: "mug", label: "Mug", ounces: 12 },
  { id: "bottle", label: "Bottle", ounces: 16 },
] as const;

export default function WaterScreen({ data, update, date, setDate, navigate }: ScreenProps) {
  const [selected, setSelected] = useState<(typeof servings)[number]["id"]>("glass");
  const serving = servings.find(item => item.id === selected)!;
  const water = Math.max(0, data.nutrition[date]?.water ?? 0);
  const ounces = Math.round(water * 1000 / ML_PER_OUNCE);
  const log = (amount: number) => update(store => {
    const entry = store.nutrition[date] ?? emptyNutrition();
    const next = Math.max(0, Math.round((entry.water + amount * ML_PER_OUNCE / 1000) * 1e6) / 1e6);
    return { ...store, nutrition: { ...store.nutrition, [date]: { ...entry, water: next } } };
  }, amount > 0 ? `${amount} oz added` : "Water updated");

  return <section className="water-screen" aria-label="Water tracker">
    <div className="water-screen-content">
      <header className="water-screen-toolbar">
        <button type="button" className="water-back" aria-label="Back to journal" onClick={() => navigate("overview")}><ArrowLeft /></button>
        <div className="water-screen-date"><DatePicker value={date} onChange={setDate} label="Water date" showValue /></div>
      </header>
      <div className="water-screen-intro">
        <h1>How much did you<br />drink today?</h1>
        <p>Log water from a glass, mug, or bottle.<br />Every sip counts.</p>
      </div>
      <div className="water-amount-control">
        <button type="button" className="water-amount-button" aria-label={`Remove ${serving.ounces} ounces`} disabled={water === 0} onClick={() => log(-serving.ounces)}><Minus /></button>
        <div className="water-amount-display">
          <output aria-label="Water consumed in ounces" aria-live="polite">{ounces}</output>
          <span>Ounces</span>
        </div>
        <button type="button" className="water-amount-button" aria-label={`Add ${serving.ounces} ounces`} onClick={() => log(serving.ounces)}><Plus /></button>
      </div>
      <p className="water-daily-total">{water.toLocaleString("en-IN", { maximumFractionDigits: 2 })} L logged · {formatDate(date, { month: "short", day: "numeric" })}{data.sampleData && <span> · Sample journal</span>}</p>
      <section className="water-serving-section" aria-labelledby="water-serving-heading">
        <h2 id="water-serving-heading">Choose an amount</h2>
        <div className="water-serving-list">
          {servings.map(item => <div className="water-serving-row" key={item.id}>
            <button type="button" className="water-serving-card" aria-label={`Select ${item.label.toLowerCase()}, ${item.ounces} ounces`} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>
              <span className="water-serving-quantity"><strong>{item.ounces}</strong><span>oz</span></span>
              <span className="water-serving-vessel"><DrinkVessel kind={item.id} /><span className="water-vessel-name">{item.label}</span></span>
            </button>
            <button type="button" className="water-serving-add" aria-label={`Log ${item.label.toLowerCase()}, ${item.ounces} ounces`} onClick={() => { setSelected(item.id); log(item.ounces); }}><Plus /></button>
          </div>)}
        </div>
      </section>
    </div>
  </section>;
}
