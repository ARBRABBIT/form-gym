"use client";
import type { Account } from "./accounts";
import { newMemberStore, type Store } from "./model";
import { validJournal } from "./journal-validation";

export const LOCAL_ACCOUNTS = process.env.NEXT_PUBLIC_ACCOUNT_MODE !== "server";
const KEY = "form-local-accounts-v1";
const SESSION = "form-local-session-v1";
type SavedAccount = Account & { salt: string; passwordHash: string };
type Journal = { data: Store; revision: number; updatedBy?: string; updatedAt?: string };
type LocalData = { accounts: SavedAccount[]; journals: Record<string, Journal>; links: [string, string][] };
const read = (): LocalData => JSON.parse(localStorage.getItem(KEY) || '{"accounts":[],"journals":{},"links":[]}');
const write = (data: LocalData) => localStorage.setItem(KEY, JSON.stringify(data));
const publicAccount = ({ id, email, name, role, coachCode }: Account): Account => ({ id, email, name, role, coachCode });
const json = (body: object, status = 200) => Response.json(body, { status });
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
async function hash(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 210000 }, key, 256)));
}

/** Browser-only prototype storage. Server mode continues to use the real API. */
export async function journalFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = new URL(input, location.origin);
  if (!LOCAL_ACCOUNTS || !["/api/account", "/api/journal", "/api/members"].includes(url.pathname)) return fetch(input, init);
  try {
    const method = init?.method || "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
    let saved = read();
    const actor = saved.accounts.find(a => a.id === sessionStorage.getItem(SESSION));
    if (url.pathname === "/api/account") {
      if (method === "GET") return json({ account: actor ? publicAccount(actor) : null });
      if (method === "DELETE") { sessionStorage.removeItem(SESSION); return json({ ok: true }); }
      if (method !== "POST") return json({ error: "Unsupported account action." }, 405);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof body.password !== "string" || body.password.length < 8 || body.password.length > 256) return json({ error: "Use a valid email and a password of 8–256 characters." }, 400);
      let account = saved.accounts.find(a => a.email === email);
      if (body.signup) {
        if (account) return json({ error: "An account with this email is already saved in this browser. Try logging in." }, 409);
        if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 100 || !["member", "trainer"].includes(body.role)) return json({ error: "Enter your name and account type." }, 400);
        const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
        const passwordHash = await hash(body.password, salt);
        saved = read();
        if (saved.accounts.some(a => a.email === email)) return json({ error: "This email is already saved in this browser." }, 409);
        account = { id: crypto.randomUUID(), email, name: body.name.trim(), role: body.role, coachCode: body.role === "trainer" ? hex(crypto.getRandomValues(new Uint8Array(12))) : null, salt, passwordHash };
        saved.accounts.push(account);
        const data = newMemberStore(email, account.name);
        data.onboarded = false;
        saved.journals[account.id] = { data, revision: 0 };
        write(saved);
      } else {
        if (!account || await hash(body.password, account.salt) !== account.passwordHash) return json({ error: "Email or password is incorrect. Use an account saved in this browser." }, 401);
        if (body.role !== account.role) return json({ error: `This is a ${account.role} account. Select ${account.role === "trainer" ? "Trainer" : "Member"} to log in.` }, 403);
      }
      sessionStorage.setItem(SESSION, account.id);
      return json({ account: publicAccount(account) });
    }
    if (!actor) return json({ error: "Please log in again." }, 401);
    if (url.pathname === "/api/members") {
      if (method === "GET") return actor.role === "trainer"
        ? json({ members: saved.accounts.filter(a => saved.links.some(([t, m]) => t === actor.id && m === a.id)).map(a => ({ id: a.id, email: a.email, name: saved.journals[a.id]?.data.profile.Name || a.name })), coachCode: actor.coachCode })
        : json({ trainers: saved.accounts.filter(a => saved.links.some(([t, m]) => t === a.id && m === actor.id)).map(publicAccount) });
      if (actor.role !== "member") return json({ error: "Log in as a member to share your journal." }, 403);
      if (method === "POST") {
        const trainer = saved.accounts.find(a => a.role === "trainer" && a.coachCode === String(body.code).trim());
        if (!trainer) return json({ error: "Trainer code not found in this browser." }, 400);
        if (!saved.links.some(([t, m]) => t === trainer.id && m === actor.id)) saved.links.push([trainer.id, actor.id]);
        write(saved); return json({ trainer: publicAccount(trainer) });
      }
      if (method === "DELETE") { saved.links = saved.links.filter(([t, m]) => !(t === body.trainerId && m === actor.id)); write(saved); return json({ ok: true }); }
    }
    if (url.pathname === "/api/journal") {
      const id = url.searchParams.get("memberId") || actor.id;
      if (actor.id !== id && !(actor.role === "trainer" && saved.links.some(([t, m]) => t === actor.id && m === id))) return json({ error: "This journal has not been shared with you." }, 403);
      const journal = saved.journals[id];
      if (!journal) return json({ error: "Journal not found." }, 404);
      if (method === "GET") return json(journal);
      if (method === "PATCH") {
        const changes = body.changes as { key: keyof Store; before: unknown; after: unknown }[];
        if (!Array.isArray(changes) || !changes.length || changes.length > 50 || changes.some(c => !c || typeof c.key !== "string" || ["__proto__", "constructor", "prototype", "account", "sampleData", "memberJournals"].includes(c.key) || !Object.hasOwn(c, "before") || !Object.hasOwn(c, "after"))) return json({ error: "Invalid journal update." }, 400);
        if (changes.some(c => JSON.stringify(journal.data[c.key] ?? null) !== JSON.stringify(c.before))) return json({ ...journal, error: "Another tab changed this section. Review the saved version." }, 409);
        const next = structuredClone(journal.data);
        for (const c of changes) { if (c.after === null) delete next[c.key]; else Object.assign(next, { [c.key]: c.after }); }
        if (!validJournal(next)) return json({ error: "Invalid journal values." }, 400);
        saved.journals[id] = { data: next, revision: journal.revision + 1, updatedBy: actor.id, updatedAt: new Date().toISOString() };
        write(saved); return json(saved.journals[id]);
      }
    }
    return json({ error: "Unsupported action." }, 405);
  } catch {
    return json({ error: "Unable to save in this browser. Check that browser storage is enabled and has free space." }, 503);
  }
}
