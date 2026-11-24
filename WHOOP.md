# WHOOP connection

Research checked 23 November 2026 against WHOOP's official documentation.

- Developer platform/API access is currently free. WHOOP may change pricing with prior notice: https://developer.whoop.com/api-terms-of-use/ (Pricing).
- A WHOOP membership is required to develop an app: https://developer.whoop.com/docs/developing/overview/ . Members need their WHOOP device/account; API access does not replace the membership.
- API v2 offers sleep, recovery (including HRV and resting heart rate), daily cycles/strain, workouts and other scoped data: https://developer.whoop.com/api/ . Continuous heart-rate streaming is not provided by the API: https://developer.whoop.com/docs/developing/support/ .
- Connections authorize a WHOOP account through OAuth, rather than pairing to a watch over Bluetooth: https://developer.whoop.com/docs/developing/oauth/ .

## Enable live connection

1. Register Form in the WHOOP Developer Dashboard using a WHOOP member account.
2. Use the scopes `read:profile`, `read:recovery`, `read:sleep`, `read:cycles`, `read:workout`, and `offline` for refresh tokens.
3. Copy `.env.example` to `.env.local`. Fill in the client ID, client secret and a generated 32-byte cookie key. Keep these on the server; never use `NEXT_PUBLIC_` or put secrets in chat or browser storage.
4. Serve Form at an HTTPS origin. Register that exact origin's `/api/whoop/callback` URL with WHOOP and set `WHOOP_REDIRECT_URI` to it. Open Form at that same origin. A plain HTTP LAN URL is suitable for previewing the UI, but not for completing this OAuth flow.
5. Restart Next.js, open onboarding, select WHOOP, and choose Connect WHOOP. After consent, WHOOP redirects to the saved setup draft. Status is verified by the server, not by the URL query parameter.

No developer credentials were supplied in this session. A live WHOOP authorization/token exchange could not be tested. The connection screen, skip flow, unavailable state, mocked cancellation/connected UI, and unconfigured API/origin rejection are covered by browser tests.

## Implementation scope

The sixth onboarding step captures the starting profile; the optional wearable step is fifth. Selection is saved with the setup draft. Completed onboarding remains completed for existing members.

Server routes provide authorization initiation, callback, refresh/status verification and revocation. They request read-only access to the declared WHOOP data. The callback checks an expiring, encrypted state cookie; tokens are stored in an encrypted HttpOnly, Secure, SameSite=Lax cookie restricted to `/api/whoop`. Tokens and WHOOP passwords are never written to localStorage or returned to the client. Connection status is checked through WHOOP's basic profile endpoint. Disconnect revokes the WHOOP grant before deleting the session cookie.

The home dashboard now fetches selected-day health metrics through `/api/whoop/metrics`. See HEALTH.md. Webhooks and historical imports remain future work. No sample health metrics or simulated successful connections are shown.

The existing app still has demo login and one browser-local journal. The WHOOP connection is associated with that browser, not a production user account. Before a multi-user release, attach connections to real authenticated user IDs and move token storage/refresh coordination into a server-side account store. Public app approval and rate limits also apply; consult WHOOP's current launch documentation.

## Dedicated connection screen - 24 November 2026

Selecting Connect WHOOP now opens a white, full-screen native dialog before authorization. A realistic official WHOOP 5.0 CloudKnit product image sits over animated signal rings; reduced-motion preference freezes the rings. Back and Escape close the screen and restore focus to the trigger. Continue to WHOOP starts the existing separate-tab OAuth flow and preserves in-memory onboarding. Unavailable/access errors remain visible within the screen. A connected heading is shown only after the status endpoint verifies a connection; Done returns to the setup step.

UI: src/components/whoop-connection-screen.tsx and src/app/whoop-connection.css. The existing shared WearableConnect component opens it from onboarding or health connection management. Device imagery is locally bundled at public/images/whoop-5-cloudknit.webp, sourced from https://www.whoop.com/us/en/ with exact CDN provenance in its .webp.json sidecar; no generated device features. This is account authorization, not Bluetooth pairing.

Validation: three current WHOOP browser tests cover the intermediate screen, unavailable access, rejected origins, mocked separate-tab consent, verified connected state, focus restoration, Escape, 320/375/425px phones, 1440px desktop, and reduced-motion behavior. Mocked consent does not prove live authorization. Existing credentials and HTTPS deployment requirements still apply.

## Sample journal preview

The sample journal now intentionally includes labeled illustrative WHOOP-style readings at the user's request. This preview uses sampleHealth only when Store.sampleData is true, leaves connected/configured false and never simulates an OAuth success. New personal journals set sampleData false and continue using the live API integration. Earlier no-sample statements above describe the pre-preview implementation.
