"use client";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  HeartPulse,
  Moon,
  ShieldCheck,
  Watch,
} from "lucide-react";
import { Button } from "./ui";
import WhoopConnectionScreen from "./whoop-connection-screen";

type Choice = "whoop" | "none";
export default function WearableConnect({
  choice,
  onSelect,
  beforeConnect,
  returnTo = "onboarding",
}: {
  choice?: Choice;
  onSelect: (choice: Choice) => void;
  beforeConnect: () => boolean;
  returnTo?: "home" | "onboarding";
}) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showConnection, setShowConnection] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const result = new URLSearchParams(location.search).get("whoop");
    if (result && result !== "connected")
      setMessage(
        result === "cancelled"
          ? "No problem. You haven’t connected WHOOP. Try again or skip for now."
          : "We couldn’t finish connecting. Please try again.",
      );
    fetch("/api/whoop/status", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const status = await response.json();
        setConnected(status.connected === true);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setMessage(
            "We couldn’t check your connection. You can try connecting again.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    if (result) {
      const url = new URL(location.href);
      url.searchParams.delete("whoop");
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    return () => controller.abort();
  }, []);
  const connect = async () => {
    if (!beforeConnect()) return;
    const connectionWindow = window.open("about:blank", "_blank");
    if (!connectionWindow) {
      setMessage("Allow a new tab to connect WHOOP without losing your current progress.");
      return;
    }
    connectionWindow.opener = null;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/whoop/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo }),
      });
      const body = await response.json();
      if (!response.ok) {
        connectionWindow.close();
        setMessage(
          body.error === "not_configured"
            ? "WHOOP connection isn’t available in this app yet. You can continue without connecting."
            : body.error === "secure_address_required"
              ? "Please open the app at its secure HTTPS address to connect WHOOP."
              : "WHOOP couldn’t open. Please try again.",
        );
        setBusy(false);
        return;
      }
      const target = new URL(body.url);
      if (
        target.origin !== "https://api.prod.whoop.com" ||
        target.pathname !== "/oauth/oauth2/auth"
      )
        throw new Error();
      connectionWindow.location.replace(target.toString());
      setMessage("Finish connecting in the WHOOP tab, then return here.");
      setBusy(false);
    } catch {
      connectionWindow.close();
      setMessage(
        "We couldn’t reach WHOOP. Check your connection and try again.",
      );
      setBusy(false);
    }
  };
  useEffect(() => {
    const refresh = () => {
      fetch("/api/whoop/status", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((status) => {
          if (status?.connected) {
            setConnected(true);
            setMessage("WHOOP connected. You can keep going.");
          }
        })
        .catch(() => {});
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  const disconnect = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/whoop/status", { method: "DELETE" });
      if (!response.ok) throw new Error();
      setConnected(false);
      onSelect("none");
      setMessage("WHOOP disconnected. You can still keep a journal manually.");
    } catch {
      setMessage(
        "We couldn’t disconnect WHOOP. Please try again, or revoke access in your WHOOP app.",
      );
    }
    setBusy(false);
  };
  return (
    <div className="wearable-connect">
      <fieldset className="wearable-options">
        <legend>Choose how you’d like to track</legend>
        <label
          className={`wearable-option ${choice === "whoop" ? "selected" : ""}`}
        >
          <input
            type="radio"
            name="wearable"
            value="whoop"
            checked={choice === "whoop"}
            onChange={() => onSelect("whoop")}
          />
          <Watch size={27} />
          <span>
            <strong>WHOOP</strong>
            <small>
              {loading
                ? "Checking connection…"
                : connected
                  ? "Connected to your WHOOP account"
                  : "Sleep, recovery, strain & workouts"}
            </small>
          </span>
          {connected && <Check size={18} aria-hidden="true" />}
        </label>
        <label
          className={`wearable-option ${choice === "none" ? "selected" : ""}`}
        >
          <input
            type="radio"
            name="wearable"
            value="none"
            checked={choice === "none"}
            onChange={() => onSelect("none")}
          />
          <span>
            <strong>I’ll track on my own</strong>
            <small>No wearable needed. Your journal works either way.</small>
          </span>
        </label>
      </fieldset>
      {choice === "whoop" && (
        <section className="wearable-details" aria-label="WHOOP connection">
          <div className="wearable-metrics">
            <span>
              <Moon size={18} /> Sleep
            </span>
            <span>
              <HeartPulse size={18} /> Recovery
            </span>
            <span>
              <Activity size={18} /> Strain
            </span>
          </div>
          <p>
            Sign in to WHOOP and choose whether to share your profile, sleep,
            recovery, daily strain and workouts. Your watch stays paired with
            the WHOOP app.
          </p>
          <div className="wearable-privacy">
            <ShieldCheck size={18} />
            <span>
              Your WHOOP password stays with WHOOP. You can revoke access
              anytime in the WHOOP app.
            </span>
          </div>
          {connected ? (
            <>
              <p className="wearable-connected">
                <Check size={16} /> WHOOP connected
              </p>
              <Button
                variant="secondary"
                disabled={busy || loading}
                onClick={disconnect}
              >
                {busy ? "Disconnecting…" : "Disconnect WHOOP"}
              </Button>
            </>
          ) : (
            <Button disabled={busy || loading} onClick={() => setShowConnection(true)}>
              {busy ? "Opening WHOOP…" : "Connect WHOOP"}
              <ArrowUpRight size={17} />
            </Button>
          )}
          <p className="helper wearable-membership">
            WHOOP device and membership required. The API connection has no
            additional fee.
          </p>
        </section>
      )}
      {message && !showConnection && (
        <p className="wearable-message" role="status">
          {message}
        </p>
      )}
      {showConnection && <WhoopConnectionScreen connected={connected} busy={busy} message={message} onConnect={connect} onClose={() => setShowConnection(false)} />}
    </div>
  );
}
