"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Activity, ArrowLeft, ArrowUpRight, Check, HeartPulse, Moon, ShieldCheck } from "./icons";
import { lockModalBackground } from "./modal-environment";

export default function WhoopConnectionScreen({ connected, busy, message, onConnect, onClose }: {
  connected: boolean;
  busy: boolean;
  message: string;
  onConnect: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    const restore = lockModalBackground();
    back.current?.focus({ preventScroll: true });
    return () => {
      element?.close();
      restore();
      previous?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog ref={dialog} className="whoop-screen" aria-labelledby="whoop-screen-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="whoop-screen-content">
        <header className="whoop-screen-header">
          <button ref={back} type="button" onClick={onClose} className="whoop-screen-back"><ArrowLeft size={18} /> Back</button>
          <span className="whoop-screen-brand">form. <span>×</span> WHOOP</span>
        </header>
        <div className="whoop-screen-intro">
          <h1 id="whoop-screen-title">{connected ? <>You’re connected.<br />A little more in sync.</> : <>Your WHOOP.<br />Your daily picture.</>}</h1>
          <p>{connected ? "Your WHOOP account is connected to Form." : "Bring your sleep, recovery and strain together in Form."}</p>
        </div>
        <div className="whoop-device-stage">
          <div className="whoop-signal-field" aria-hidden="true"><span /><span /><span /></div>
          <img src="/images/whoop-5-cloudknit.webp" alt="WHOOP 5.0 sensor with a blue and white CloudKnit fabric band" width="900" height="1008" className="whoop-device-image" />
          <span className={`whoop-device-status ${connected ? "is-connected" : ""}`}>
            {connected ? <Check size={13} /> : <span className="whoop-status-dot" />}
            {connected ? "Account connected" : "Ready when you are"}
          </span>
        </div>
        <div className="whoop-screen-footer">
          <div className="whoop-screen-metrics" aria-label="Data available through WHOOP">
            <span><Moon size={16} /> Sleep</span><span><HeartPulse size={16} /> Recovery</span><span><Activity size={16} /> Strain</span>
          </div>
          <p className="whoop-screen-explainer">{connected ? "Your readings appear once WHOOP has synced and processed them." : "Continue to WHOOP to sign in and choose what to share. Your band stays paired with the WHOOP app."}</p>
          {message && <p className="whoop-screen-message" role="status">{message}</p>}
          <button type="button" className="whoop-screen-primary" disabled={busy} onClick={connected ? onClose : onConnect}>
            {connected ? "Done" : busy ? "Opening WHOOP…" : "Continue to WHOOP"}
            {connected ? <Check size={19} /> : <ArrowUpRight size={19} />}
          </button>
          <p className="whoop-screen-privacy"><ShieldCheck size={14} /> You choose what to share. Disconnect anytime.</p>
        </div>
      </div>
    </dialog>, document.body,
  );
}
