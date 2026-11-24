import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import {
  API,
  config,
  SCOPES,
  STATE,
  seal,
  setCookie,
  sameOrigin,
} from "@/lib/whoop";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const settings = config();
  if (!settings)
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (request.headers.get("origin") !== new URL(settings.redirectUri).origin)
    return NextResponse.json(
      { error: "secure_address_required" },
      { status: 409 },
    );
  let returnTo = "onboarding";
  try {
    if ((await request.json()).returnTo === "home") returnTo = "home";
  } catch {
    /* Older onboarding clients have no request body. */
  }
  const state = randomBytes(6).toString("base64url");
  const url = new URL(`${API}/oauth/oauth2/auth`);
  url.search = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: settings.redirectUri,
    response_type: "code",
    scope: SCOPES,
    state,
  }).toString();
  const response = NextResponse.json(
    { url: url.toString() },
    { headers: { "Cache-Control": "no-store" } },
  );
  setCookie(
    response,
    STATE,
    seal({ state, issuedAt: Date.now(), returnTo }),
    600,
  );
  return response;
}
