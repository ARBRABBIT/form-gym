import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  config,
  STATE,
  SESSION,
  unseal,
  seal,
  setCookie,
  exchange,
  profile,
} from "@/lib/whoop";
export async function GET(request: NextRequest) {
  const settings = config();
  if (!settings)
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const saved = unseal<{ state: string; issuedAt: number; returnTo?: string }>(
    request.cookies.get(STATE)?.value,
  );
  const finish = (result: string) => {
    const response = NextResponse.redirect(
      new URL(
        `/?whoop=${result}#${saved?.returnTo === "home" ? "overview" : "onboarding"}`,
        settings.redirectUri,
      ),
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    setCookie(response, STATE, "", 0);
    return response;
  };

  const state = request.nextUrl.searchParams.get("state") || "";
  if (
    !/^[A-Za-z0-9_-]{8}$/.test(state) ||
    !saved ||
    Date.now() - saved.issuedAt > 600000 ||
    Date.now() < saved.issuedAt ||
    state.length !== saved.state.length ||
    !timingSafeEqual(Buffer.from(state), Buffer.from(saved.state))
  )
    return finish("invalid_state");
  if (request.nextUrl.searchParams.has("error")) return finish("cancelled");
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return finish("failed");
  try {
    const tokens = await exchange({
      grant_type: "authorization_code",
      code,
      redirect_uri: settings.redirectUri,
    });
    const userResponse = await profile(tokens.accessToken);
    if (!userResponse.ok) return finish("failed");
    const user = await userResponse.json();
    if (!Number.isSafeInteger(user.user_id)) return finish("failed");
    const response = finish("connected");
    setCookie(
      response,
      SESSION,
      seal({ ...tokens, userId: user.user_id }),
      30 * 86400,
    );
    return response;
  } catch {
    return finish("failed");
  }
}
