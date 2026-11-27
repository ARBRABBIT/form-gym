"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Store } from "./model";
const pendingSaves = new Set<() => Promise<boolean>>();
export async function flushAllJournals() {
  const results = await Promise.all([...pendingSaves].map((save) => save()));
  return results.every(Boolean);
}
const encoded = (value: unknown) => JSON.stringify(value ?? null);
export function useJournalSync(id?: string, enabled = true) {
  const [data, setData] = useState<Store | null>(null);
  const [loadedId, setLoadedId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState("Opening saved journal…");
  const [conflict, setConflict] = useState<Store | null>(null);
  const [error, setError] = useState(false);
  const current = useRef<Store | null>(null),
    base = useRef<Store | null>(null),
    busy = useRef(false),
    blocked = useRef(false);
  const runner = useRef<(() => Promise<void>) | null>(null);
  const flush = useCallback(async () => {
    while (busy.current)
      await new Promise((resolve) => setTimeout(resolve, 30));
    await runner.current?.();
    return (
      !blocked.current && encoded(current.current) === encoded(base.current)
    );
  }, []);
  const endpoint = `/api/journal${id ? `?memberId=${encodeURIComponent(id)}` : ""}`;
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    current.current = null;
    base.current = null;
    blocked.current = false;
    busy.current = false;
    setData(null);
    setConflict(null);
    setError(false);
    const tick = async () => {
      if (busy.current || blocked.current) return;
      busy.current = true;
      try {
        const snapshot = current.current;
        const changes =
          snapshot && base.current
            ? Object.keys({ ...base.current, ...snapshot })
                .filter(
                  (key) =>
                    !["account", "sampleData", "memberJournals"].includes(
                      key,
                    ) &&
                    encoded(base.current![key as keyof Store]) !==
                      encoded(snapshot[key as keyof Store]),
                )
                .map((key) => ({
                  key,
                  before: base.current![key as keyof Store] ?? null,
                  after: snapshot[key as keyof Store] ?? null,
                }))
            : [];
        const response = await fetch(
          endpoint,
          changes.length
            ? {
                method: "PATCH",
                signal: AbortSignal.timeout(12000),
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ changes }),
              }
            : { cache: "no-store", signal: AbortSignal.timeout(12000) },
        );
        const body = await response.json();
        if (!active) return;
        if (response.status === 401 || response.status === 403) {
          blocked.current = true;
          current.current = null;
          base.current = null;
          setData(null);
          setStatus(body.error);
          setError(true);
          return;
        }
        if (response.status === 409) {
          blocked.current = true;
          setConflict(body.data);
          setStatus(body.error);
          setError(true);
          return;
        }
        if (!response.ok || !body.data)
          throw new Error(
            body.error ||
              "Unable to sync. Your changes remain on screen; retrying.",
          );
        // Keep edits made while this request was in flight, and merge unrelated remote changes.
        const latest = current.current;
        const next = { ...body.data } as Store;
        if (snapshot && latest)
          for (const key of Object.keys(latest) as (keyof Store)[])
            if (encoded(latest[key]) !== encoded(snapshot[key]))
              Object.assign(next, { [key]: latest[key] });
        setLoadedId(id);
        base.current = body.data;
        if (encoded(current.current) !== encoded(next)) {
          current.current = next;
          setData(next);
        }
        setError(false);
        setStatus(
          encoded(current.current) !== encoded(base.current)
            ? "Saving changes…"
            : changes.length
              ? "All changes saved"
              : "Up to date",
        );
      } catch (error) {
        if (active) {
          setError(true);
          setStatus(
            error instanceof Error
              ? error.message
              : "Unable to sync. Retrying…",
          );
        }
      } finally {
        if (active) busy.current = false;
      }
    };
    runner.current = tick;
    pendingSaves.add(flush);
    void tick();
    const interval = setInterval(tick, 1500);
    const unload = (event: BeforeUnloadEvent) => {
      if (encoded(current.current) !== encoded(base.current)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    const focus = () => void tick();
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      runner.current = null;
      pendingSaves.delete(flush);
      clearInterval(interval);
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("focus", focus);
    };
  }, [endpoint, enabled, flush]);
  const update = useCallback((fn: (s: Store) => Store) => {
    if (!current.current) return;
    const next = fn(current.current);
    current.current = next;
    setData(next);
    setStatus("Saving changes…");
    void runner.current?.();
  }, []);
  const resolve = useCallback(
    (keepLocal: boolean) => {
      if (!conflict) return;
      base.current = conflict;
      if (!keepLocal) {
        current.current = conflict;
        setData(conflict);
      }
      setConflict(null);
      blocked.current = false;
      setError(false);
      setStatus(
        keepLocal ? "Saving your reviewed version…" : "Saved version loaded",
      );
    },
    [conflict],
  );
  return {
    data: loadedId === id ? data : null,
    update,
    status,
    error,
    conflict,
    resolve,
    flush,
  };
}
