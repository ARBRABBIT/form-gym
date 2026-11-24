import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const API = "https://api.prod.whoop.com";
export const SESSION = "form-whoop-session";
export const STATE = "form-whoop-state";
export const SCOPES =
  "offline read:profile read:recovery read:sleep read:cycles read:workout";
export type WhoopSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: number;
};
export function config() {
  const {
    WHOOP_CLIENT_ID: clientId,
    WHOOP_CLIENT_SECRET: clientSecret,
    WHOOP_REDIRECT_URI: redirectUri,
    WHOOP_COOKIE_KEY: key,
  } = process.env;
  if (
    !clientId ||
    !clientSecret ||
    !redirectUri ||
    !key ||
    !/^[a-fA-F0-9]{64}$/.test(key)
  )
    return null;
  try {
    const url = new URL(redirectUri);
    if (url.protocol !== "https:" || url.pathname !== "/api/whoop/callback")
      return null;
  } catch {
    return null;
  }
  return { clientId, clientSecret, redirectUri, key: Buffer.from(key, "hex") };
}
export function seal(value: unknown) {
  const settings = config();
  if (!settings) throw new Error("Not configured");
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", settings.key, iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}
export function unseal<T>(value?: string): T | null {
  try {
    const settings = config();
    if (!settings || !value) return null;
    const bytes = Buffer.from(value, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      settings.key,
      bytes.subarray(0, 12),
    );
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([
        decipher.update(bytes.subarray(28)),
        decipher.final(),
      ]).toString("utf8"),
    ) as T;
  } catch {
    return null;
  }
}
export function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number,
) {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/whoop",
    maxAge,
  });
}
export function sameOrigin(request: NextRequest) {
  try {
    const origin = new URL(request.headers.get("origin") || "");
    return (
      ["http:", "https:"].includes(origin.protocol) &&
      origin.host === request.headers.get("host")
    );
  } catch {
    return false;
  }
}
export async function exchange(fields: Record<string, string>) {
  const settings = config();
  if (!settings) throw new Error("Not configured");
  const response = await fetch(`${API}/oauth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      ...fields,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Authorization failed");
  const token = await response.json();
  if (
    typeof token.access_token !== "string" ||
    typeof token.refresh_token !== "string" ||
    !Number.isFinite(token.expires_in) ||
    token.expires_in <= 0
  )
    throw new Error("Invalid authorization");
  const granted = new Set(String(token.scope || "").split(" "));
  if (
    SCOPES.split(" ")
      .filter((scope) => scope !== "offline")
      .some((scope) => !granted.has(scope))
  )
    throw new Error("Missing permissions");
  return {
    accessToken: token.access_token as string,
    refreshToken: token.refresh_token as string,
    expiresAt: Date.now() + token.expires_in * 1000,
  };
}
export async function profile(token: string) {
  const response = await fetch(`${API}/developer/v2/user/profile/basic`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  return response;
}
