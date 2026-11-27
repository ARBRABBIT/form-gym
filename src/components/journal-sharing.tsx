"use client";
import { journalFetch, LOCAL_ACCOUNTS } from "@/lib/local-journal-api";
import { useEffect, useState } from "react";
import { Button, Field, Section } from "./ui";
export default function JournalSharing() {
  const [code, setCode] = useState(""),
    [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = () =>
    journalFetch("/api/members", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => setTrainers(b.trainers || []));
  useEffect(() => {
    void load();
  }, []);
  return (
    <Section title="Your trainer">
      <p className="section-description">
        {LOCAL_ACCOUNTS
          ? "Link a trainer account saved in this browser. Sharing stays on this device and does not sync across devices."
          : "Share your health, journal, food and workouts with your trainer. Both of you can edit your journal; saved changes appear in both accounts."}
      </p>
      {trainers.map((t) => (
        <div className="sharing-row" key={t.id}>
          <strong>{t.name}</strong>
          <Button
            variant="ghost"
            onClick={async () => {
              const r = await journalFetch("/api/members", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trainerId: t.id }),
              });
              if (r.ok) {
                await load();
                setMessage("Journal sharing stopped.");
              } else setMessage("Unable to stop sharing. Please try again.");
            }}
          >
            Stop sharing
          </Button>
        </div>
      ))}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await journalFetch("/api/members", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            });
            const b = await r.json();
            if (!r.ok) throw new Error(b.error);
            setMessage(`Journal shared with ${b.trainer.name}.`);
            setCode("");
            await load();
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "Unable to share.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Trainer code" required value={code} onChange={setCode} />
        <Button type="submit" disabled={busy}>
          {busy ? "Sharing…" : "Share my journal"}
        </Button>
      </form>
      <p role="status">{message}</p>
    </Section>
  );
}
