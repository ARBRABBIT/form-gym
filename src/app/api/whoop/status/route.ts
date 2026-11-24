import { NextRequest, NextResponse } from "next/server";
import {
  API,
  config,
  SESSION,
  unseal,
  seal,
  setCookie,
  exchange,
  profile,
  sameOrigin,
  type WhoopSession,
} from "@/lib/whoop";
const json = (value: object, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
export async function GET(request: NextRequest) {
  if (!config()) return json({ configured: false, connected: false });
  let session = unseal<WhoopSession>(request.cookies.get(SESSION)?.value);
  if (!session) return json({ configured: true, connected: false });
  let renewed = false;
  const unavailable = () => {
    const result = json({ configured: true, error: "unavailable" }, 502);
    // Preserve rotated refresh credentials even if the profile request fails.
    if (renewed && session)
      setCookie(result, SESSION, seal(session), 30 * 86400);
    return result;
  };
  try {
    if (session.expiresAt <= Date.now() + 60000) {
      session = {
        ...session,
        ...(await exchange({
          grant_type: "refresh_token",
          refresh_token: session.refreshToken,
          scope: "offline",
        })),
      };
      renewed = true;
    }
    const response = await profile(session.accessToken);
    if (response.status === 401) {
      const result = json({ configured: true, connected: false });
      setCookie(result, SESSION, "", 0);
      return result;
    }
    if (!response.ok) return unavailable();
    const user = await response.json();
    if (user.user_id !== session.userId) throw new Error("Invalid account");
    const result = json({ configured: true, connected: true });
    setCookie(result, SESSION, seal(session), 30 * 86400);
    return result;
  } catch {
    return unavailable();
  }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "invalid_origin" }, 403);
  let session = unseal<WhoopSession>(request.cookies.get(SESSION)?.value);
  const retry = () => {
    const result = json({ error: "unavailable" }, 502);
    if (session) setCookie(result, SESSION, seal(session), 30 * 86400);
    return result;
  };
  if (session) {
    try {
      const token =
        session.expiresAt <= Date.now()
          ? await exchange({
              grant_type: "refresh_token",
              refresh_token: session.refreshToken,
              scope: "offline",
            })
          : session;
      session = { ...session, ...token };
      const response = await fetch(`${API}/developer/v2/user/access`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token.accessToken}` },
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok && response.status !== 401) return retry();
    } catch {
      return retry();
    }
  }
  const result = json({ connected: false });
  setCookie(result, SESSION, "", 0);
  return result;
}
