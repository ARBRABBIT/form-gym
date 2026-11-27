"use client";

import { useState } from "react";
import { Check, Droplet, Plus, Settings2 } from "./icons";
import { Button, Field, Sheet } from "./ui";
import DrinkVessel from "./drink-vessel";
import { formatDate, type SmartBottleProvider } from "@/lib/model";
import type { ScreenProps } from "./journal-app";

const providers = [
  {
    id: "hidratespark-pro-2", label: "HidrateSpark PRO 2", route: "Vendor access required",
    description: "Direct integration, subject to vendor access",
    help: "Direct sync is pending vendor access. Saving your bottle details does not connect it or import water. Manual logging stays available.",
    link: "https://hidratespark.com/products/32-oz-hidratespark-pro-2", linkLabel: "About HidrateSpark PRO 2",
  },
  {
    id: "larq-purevis-2", label: "LARQ PureVis 2", route: "iPhone connection required",
    description: "Through the LARQ app and Apple Health",
    help: "Pair your bottle in the LARQ app and enable water sharing with Apple Health. Importing that data into Form requires an iPhone app connection, which is not available on this web screen.",
    link: "https://support.livelarq.com/hc/en-us/articles/37061029850011-Apple-Health-compatibility", linkLabel: "LARQ Apple Health guide",
  },
  {id:"other",label:"Another bottle",route:"Connection pending",description:"Add your bottle’s brand and model",help:"Automatic sync is not available for this bottle yet. Keep logging your drinks manually until a connection is available.",link:"",linkLabel:""},
] as const;

const savedProvider = (bottle: ScreenProps["data"]["smartWaterBottle"]): SmartBottleProvider => bottle?.provider ?? (bottle?.brand.toLowerCase().includes("hidrate") ? "hidratespark-pro-2" : bottle?.brand.toLowerCase().includes("larq") ? "larq-purevis-2" : "other");

export default function SmartBottlePanel({ data,update,date }: Pick<ScreenProps,"data"|"update"|"date">) {
  const bottle = data.smartWaterBottle;
  const [setup,setSetup] = useState(false);
  const [preview,setPreview] = useState(false);
  const [draft,setDraft] = useState<{name:string;brand:string;provider:SmartBottleProvider}>({name:"",brand:"",provider:"other"});
  const selectedProvider = providers.find(provider => provider.id === draft.provider)!;
  const currentProvider = providers.find(provider => provider.id === savedProvider(bottle))!;
  const edit = () => { setDraft({name:bottle?.name || "My water bottle",brand:bottle?.brand || "",provider:savedProvider(bottle)}); setSetup(true); };
  return <div className="smart-bottle-panel">
    <section className="water-bottle-card" aria-label="Smart bottle connection">
      <header><span><Droplet size={17} /> Smart bottle</span><span className="water-bottle-status">{bottle ? "Connection pending" : "Not connected"}</span></header>
      <div className="water-bottle-identity"><div className="water-bottle-illustration" aria-hidden="true"><DrinkVessel kind="bottle" /></div><div><h2>{bottle?.name || "Every sip, accounted for."}</h2><p>{bottle ? `${bottle.brand} · Bottle details saved` : "Bring your bottle’s water readings into your daily total."}</p></div></div>
      {bottle && <p className="water-bottle-route"><span />{currentProvider.route}</p>}
      <p className="water-bottle-help">{bottle ? currentProvider.help : "Choose HidrateSpark PRO 2, LARQ PureVis 2, or another bottle to see its connection options."}</p>
      <Button variant="secondary" onClick={edit}>{bottle ? <Settings2 size={16} /> : <Plus size={16} />}{bottle ? "Edit bottle" : "Set up smart bottle"}</Button>
      {bottle && <button className="water-bottle-remove" onClick={() => update(store => ({...store,smartWaterBottle:undefined}),"Bottle details removed. Your water entries are unchanged.")}>Remove bottle</button>}
    </section>
    {data.sampleData && <div className="water-bottle-preview">
      <button className="water-preview-toggle" aria-expanded={preview} aria-controls="bottle-sync-preview" onClick={() => setPreview(current => !current)}>{preview ? "Hide sync preview" : "Preview bottle readings"}<span>Sample data</span></button>
      {preview && <section id="bottle-sync-preview" aria-label="Sample bottle readings" className="water-bottle-readings">
        <header><span>Example bottle activity</span><span className="water-bottle-status">Preview</span></header>
        <div className="water-bottle-summary"><p><strong className="water-source-digits">750</strong><span>ml from bottle</span></p><span>3 sample drinks<br />{formatDate(date,{month:"short",day:"numeric"})}</span></div>
        <ol>{[{time:"09:10",amount:250},{time:"11:40",amount:300},{time:"13:15",amount:200}].map(sip => <li key={sip.time}><span className="water-bottle-sip-icon"><Check size={13}/></span><div><strong>Water recorded</strong><time>{sip.time}</time></div><span><b className="water-source-digits">{sip.amount}</b> ml</span></li>)}</ol>
        <p className="water-bottle-help">Sample readings only. These are not from a connected bottle and are not added to your daily total.</p>
      </section>}
    </div>}
    {setup && <Sheet title="Set up smart bottle" className="water-bottle-sheet" onClose={() => setSetup(false)}>
      <p className="water-bottle-setup-note">Tell us which bottle you use. Saving these details does not connect the bottle or import water readings.</p>
      <form onSubmit={event => {event.preventDefault(); const brand = draft.provider === "other" ? draft.brand.trim() : selectedProvider.label; if(!draft.name.trim() || !brand) return; update(store => ({...store,smartWaterBottle:{name:draft.name.trim(),brand,provider:draft.provider,status:"pending"}}),"Bottle details saved. Connection pending.");setSetup(false);}}>
        <fieldset className="water-provider-options"><legend>Choose your bottle</legend>{providers.map(provider=><label key={provider.id} className={draft.provider===provider.id ? "selected" : ""}><input type="radio" name="water-bottle-provider" value={provider.id} checked={draft.provider===provider.id} onChange={()=>setDraft(current=>({...current,provider:provider.id}))}/><span className="water-provider-vessel" aria-hidden="true"><DrinkVessel kind="bottle"/></span><span className="water-provider-copy"><strong>{provider.label}</strong><span>{provider.description}</span></span><span className="water-provider-check" aria-hidden="true">{draft.provider===provider.id && <Check size={13}/>}</span></label>)}</fieldset>
        {draft.provider!=="other" && <div className="water-provider-guidance"><strong>{selectedProvider.route}</strong><p>{selectedProvider.help}</p><a href={selectedProvider.link} target="_blank" rel="noreferrer">{selectedProvider.linkLabel} ↗</a></div>}
        {draft.provider==="other" && <Field label="Bottle brand and model" required value={draft.brand} onChange={brand=>setDraft(current=>({...current,brand}))} placeholder="Enter the brand and model"/>}
        <Field label="Bottle name" required value={draft.name} onChange={name=>setDraft(current=>({...current,name}))} placeholder="My water bottle"/>
        <div className="water-bottle-setup-state"><Droplet size={20}/><div><strong>Manual logging stays available</strong><p>Your existing water entries will stay in your journal.</p></div></div>
        <div className="form-actions"><Button variant="secondary" onClick={()=>setSetup(false)}>Cancel</Button><Button type="submit">Save bottle details</Button></div>
      </form>
    </Sheet>}
  </div>;
}
