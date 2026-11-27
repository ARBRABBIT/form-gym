"use client";

import { useId, useRef, useState } from "react";
import type { ScreenProps } from "./journal-app";
import { ArrowLeft, Droplet, Minus, Plus } from "./icons";
import { emptyNutrition, formatDate } from "@/lib/model";
import { useValueFeedback } from "@/lib/interaction-feedback";
import DatePicker from "./date-picker";
import DrinkVessel from "./drink-vessel";
import SmartBottlePanel from "./smart-bottle-panel";

const ML_PER_OUNCE = 29.5735295625;
const servings = [
  { id: "glass", label: "Glass", ounces: 8 },
  { id: "mug", label: "Mug", ounces: 12 },
  { id: "bottle", label: "Bottle", ounces: 16 },
] as const;

export default function WaterScreen({ data, update, date, setDate, navigate }: ScreenProps) {
  const [selected, setSelected] = useState<(typeof servings)[number]["id"]>("glass");
  const [method,setMethod] = useState<"manual"|"bottle">("manual");
  const [customAmount,setCustomAmount] = useState("");
  const [customUnit,setCustomUnit] = useState<"ml"|"oz">("ml");
  const [customError,setCustomError] = useState("");
  const methodId = useId();
  const serving = servings.find(item => item.id === selected)!;
  const water = Math.max(0, data.nutrition[date]?.water ?? 0);
  const ounces = Math.round(water * 1000 / ML_PER_OUNCE);
  const amountRef = useRef<HTMLOutputElement>(null);
  useValueFeedback(amountRef, ounces);
  const logMl = (amount: number,message: string) => update(store => {
    const entry = store.nutrition[date] ?? emptyNutrition();
    const next = Math.max(0, Math.round((entry.water + amount / 1000) * 1e6) / 1e6);
    return { ...store, nutrition: { ...store.nutrition, [date]: { ...entry, water: next } } };
  }, message);
  const log = (amount: number) => logMl(amount*ML_PER_OUNCE,amount > 0 ? `${amount} oz added` : "Water updated");

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
      <div className="water-method-tabs" role="tablist" aria-label="Water logging method" onKeyDown={event => {
        if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "Home" ? "manual" : event.key === "End" ? "bottle" : method === "manual" ? "bottle" : "manual";
        setMethod(next); document.getElementById(`${methodId}-${next}`)?.focus();
      }}>
        <button type="button" role="tab" aria-label="Manual entry" id={`${methodId}-manual`} aria-controls={`${methodId}-manual-panel`} aria-selected={method==="manual"} tabIndex={method==="manual" ? 0 : -1} onClick={()=>setMethod("manual")}><Plus size={17}/>Manual entry</button>
        <button type="button" role="tab" aria-label="Smart bottle" id={`${methodId}-bottle`} aria-controls={`${methodId}-bottle-panel`} aria-selected={method==="bottle"} tabIndex={method==="bottle" ? 0 : -1} onClick={()=>setMethod("bottle")}><Droplet size={17}/>Smart bottle</button>
      </div>
      <div className="water-amount-control">
        {method === "manual" && <button type="button" className="water-amount-button" aria-label={`Remove ${serving.ounces} ounces`} disabled={water === 0} onClick={() => log(-serving.ounces)}><Minus /></button>}
        <div className="water-amount-display">
          <output ref={amountRef} aria-label="Water consumed in ounces" aria-live="polite">{ounces}</output>
          <span>Ounces</span>
        </div>
        {method === "manual" && <button type="button" className="water-amount-button" aria-label={`Add ${serving.ounces} ounces`} onClick={() => log(serving.ounces)}><Plus /></button>}
      </div>
      <p className="water-daily-total">{water.toLocaleString("en-IN", { maximumFractionDigits: 2 })} L logged · {formatDate(date, { month: "short", day: "numeric" })}{data.sampleData && <span> · Sample journal</span>}</p>
      <div role="tabpanel" id={`${methodId}-manual-panel`} aria-labelledby={`${methodId}-manual`} hidden={method!=="manual"}>
      <form className="water-custom-entry" onSubmit={event=>{
        event.preventDefault();
        const amount = Number(customAmount)*(customUnit==="oz" ? ML_PER_OUNCE : 1);
        if(!customAmount.trim() || !Number.isFinite(amount) || amount<=0 || amount>5000){setCustomError("Enter an amount greater than zero, up to 5,000 ml.");return;}
        logMl(amount,`${customAmount} ${customUnit} added`);setCustomAmount("");setCustomError("");
      }}>
        <h2>Enter an amount</h2>
        <div className="water-custom-fields"><label className="water-custom-amount"><span>Amount</span><input aria-label="Custom water amount" type="number" inputMode="decimal" min="0.01" step="any" required value={customAmount} placeholder="250" onChange={event=>{setCustomAmount(event.target.value);setCustomError("");}}/></label><label className="water-custom-unit"><span>Unit</span><select aria-label="Water amount unit" value={customUnit} onChange={event=>{setCustomUnit(event.target.value as "ml"|"oz");setCustomAmount("");setCustomError("");}}><option value="ml">ml</option><option value="oz">oz</option></select></label><button type="submit"><Plus size={17}/>Add water</button></div>
        {customError && <p role="alert">{customError}</p>}
      </form>
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
      </div><div role="tabpanel" id={`${methodId}-bottle-panel`} aria-labelledby={`${methodId}-bottle`} hidden={method!=="bottle"}><SmartBottlePanel data={data} update={update} date={date}/></div>
    </div>
  </section>;
}
