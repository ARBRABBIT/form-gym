import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WHOOP & Stool Integration Architecture & Flow Guide</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page) " of " counter(pages);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 8pt;
        color: #888888;
      }
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #111111;
      line-height: 1.5;
      font-size: 9.5pt;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    h1, h2, h3, h4 {
      color: #000000;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    h1 {
      font-size: 22pt;
      line-height: 1.15;
      margin: 0 0 4pt;
    }

    .subtitle {
      font-size: 11pt;
      color: #555555;
      margin-bottom: 18pt;
      font-weight: 400;
    }

    .badge-bar {
      display: flex;
      gap: 6pt;
      margin-bottom: 20pt;
      padding-bottom: 12pt;
      border-bottom: 1px solid #e0e0e0;
    }

    .badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 600;
      padding: 2pt 6pt;
      border-radius: 4pt;
      background: #f0f0f0;
      color: #333333;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge.highlight {
      background: #d8f365;
      color: #111111;
    }

    h2 {
      font-size: 13pt;
      margin-top: 18pt;
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      border-bottom: 1.5pt solid #111111;
      page-break-after: avoid;
    }

    h3 {
      font-size: 10.5pt;
      margin-top: 12pt;
      margin-bottom: 4pt;
      page-break-after: avoid;
    }

    p {
      margin: 0 0 7pt;
      color: #222222;
    }

    ul, ol {
      margin: 0 0 9pt 16pt;
      padding: 0;
    }

    li {
      margin-bottom: 3.5pt;
    }

    .callout {
      background: #f8f8f8;
      border-left: 3pt solid #111111;
      padding: 8pt 10pt;
      margin: 9pt 0;
      border-radius: 0 4pt 4pt 0;
    }

    .callout.accent {
      border-left-color: #8cb811;
      background: #fafdf2;
    }

    .callout-title {
      font-weight: 700;
      font-size: 9pt;
      margin-bottom: 2pt;
      color: #000000;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0 14pt;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th, td {
      padding: 5.5pt 7pt;
      text-align: left;
      border-bottom: 1px solid #e5e5e5;
    }

    th {
      background: #f4f4f4;
      font-weight: 600;
      color: #111111;
      border-top: 1px solid #d0d0d0;
      border-bottom: 1.5pt solid #111111;
    }

    tr:nth-child(even) td {
      background: #fafafa;
    }

    .flow-box {
      border: 1px solid #d5d5d5;
      border-radius: 6pt;
      padding: 10pt;
      margin: 10pt 0 14pt;
      background: #fdfdfd;
      page-break-inside: avoid;
    }

    .step-list {
      display: flex;
      flex-direction: column;
      gap: 6pt;
    }

    .step-item {
      display: flex;
      gap: 8pt;
      align-items: flex-start;
    }

    .step-num {
      width: 18pt;
      height: 18pt;
      border-radius: 50%;
      background: #111111;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1pt;
    }

    .step-content {
      flex: 1;
    }

    .step-content strong {
      display: block;
      color: #000000;
      font-size: 9pt;
      margin-bottom: 1.5pt;
    }

    .code-pill {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 7.8pt;
      background: #eeeeee;
      padding: 1.5pt 3.5pt;
      border-radius: 3pt;
      border: 1px solid #dddddd;
    }

    .page-break {
      page-break-before: always;
    }

    .two-col {
      display: flex;
      gap: 12pt;
      margin: 8pt 0;
    }

    .col {
      flex: 1;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: TITLE & EXECUTIVE SUMMARY -->
  <div>
    <h1>Form Gym Journal</h1>
    <div class="subtitle">WHOOP Wearable & Stool (Gut) Health Integration: Architecture, Security, & End-to-End Flows</div>
    
    <div class="badge-bar">
      <span class="badge highlight">Architecture Spec</span>
      <span class="badge">Next.js 16 (App Router)</span>
      <span class="badge">WHOOP API v2 (OAuth 2.0 PKCE)</span>
      <span class="badge">Bristol Stool Chart</span>
      <span class="badge">AES-256-GCM</span>
    </div>

    <h2>1. Executive Summary & Design Philosophy</h2>
    <p>
      In <strong>Form</strong>, biometric and physiological health tracking is built on a fundamental principle: 
      <em>Zero fabrication, strict medical privacy, and transparent source attribution</em>.
    </p>
    <ul>
      <li><strong>WHOOP Integration</strong>: Connects directly via WHOOP API v2 (OAuth 2.0 PKCE) to fetch verified physiological signals (Daily Strain, Recovery Score, Sleep Performance, HRV, Resting Heart Rate, SpO₂, Skin Temperature, and Respiratory Rate). The application never synthesizes missing data or invents artificial algorithms.</li>
      <li><strong>Gut (Stool) Integration</strong>: Grounded in the clinical <em>Bristol Stool Form Scale</em> (Types 1–7). Bowel motility is tracked alongside time, comfort levels, and notes. Crucially, raw personal bathroom photographs are <strong>never</strong> transmitted to generic machine learning models or uncontracted vendor endpoints.</li>
    </ul>

    <div class="callout accent">
      <div class="callout-title">Core Architectural Decision: Transparent Signal Origin</div>
      On the Home Dashboard, metrics are categorized into <strong>Overall Body</strong>, <strong>Blood Health</strong>, <strong>Lung Health</strong>, and <strong>Gut</strong>. The UI explicitly discloses data sources (e.g. <em>WHOOP v2 Cycle / Recovery</em> vs. <em>Manual Clinical Journal Entry</em>). If a device is disconnected or unscored, it renders an honest dash (<code>—</code>), never a guess.
    </div>

    <h2>2. WHOOP Wearable Integration Flow</h2>
    
    <h3>2.1 OAuth 2.0 PKCE Authorization & Token Lifecycle</h3>
    <p>
      WHOOP authorizes user data access via server-side OAuth 2.0. Form never prompts for WHOOP credentials directly and never handles raw passwords.
    </p>

    <div class="flow-box">
      <div class="step-list">
        <div class="step-item">
          <div class="step-num">1</div>
          <div class="step-content">
            <strong>Initiation (<code>GET /api/whoop/connect</code>)</strong>
            Checks server configuration (<span class="code-pill">WHOOP_CLIENT_ID</span>, <span class="code-pill">WHOOP_CLIENT_SECRET</span>, <span class="code-pill">WHOOP_REDIRECT_URI</span>). Generates a cryptographically random, timestamped state token. Seals the state inside an encrypted, HttpOnly, SameSite=Lax cookie (<span class="code-pill">form-whoop-state</span>). Redirects the browser to <span class="code-pill">https://api.prod.whoop.com/oauth/oauth2/auth</span> with requested scopes (<span class="code-pill">offline read:profile read:recovery read:sleep read:cycles read:workout</span>).
          </div>
        </div>
        <div class="step-item">
          <div class="step-num">2</div>
          <div class="step-content">
            <strong>User Consent & Callback (<code>GET /api/whoop/callback</code>)</strong>
            The member authenticates on WHOOP's official portal and approves read-only permissions. WHOOP redirects back to Form with an authorization code and the state token.
          </div>
        </div>
        <div class="step-item">
          <div class="step-num">3</div>
          <div class="step-content">
            <strong>Security Verification & Token Exchange</strong>
            The server decrypts <span class="code-pill">form-whoop-state</span> and validates state matching and expiration. It POSTs the code to WHOOP's token endpoint (<span class="code-pill">/oauth/oauth2/token</span>) to exchange for an access token, refresh token, expiration, and user ID.
          </div>
        </div>
        <div class="step-item">
          <div class="step-num">4</div>
          <div class="step-content">
            <strong>Encrypted Session Storage (<span class="code-pill">form-whoop-session</span>)</strong>
            Tokens are encrypted using <strong>AES-256-GCM</strong> with an authenticated 32-byte secret key (<span class="code-pill">WHOOP_COOKIE_KEY</span>). Stored in an HttpOnly, Secure, SameSite=Lax cookie restricted specifically to the <span class="code-pill">/api/whoop</span> path. Tokens <em>never</em> enter localStorage or client JavaScript memory.
          </div>
        </div>
        <div class="step-item">
          <div class="step-num">5</div>
          <div class="step-content">
            <strong>Auto-Refresh on Expiry</strong>
            Before invoking WHOOP developer endpoints, the server checks if <span class="code-pill">expiresAt &lt; Date.now() + 60000</span>. If expiring within 60 seconds, it uses the refresh token to seamlessly issue a renewed access token and reseals the session cookie.
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE 2: WHOOP METRICS ENGINE & STOOL INTEGRATION -->
  <div class="page-break">
    <h2>2.2 Metrics Retrieval & Normalization Engine (<code>/api/whoop/metrics</code>)</h2>
    <p>
      When the member navigates dates on the dashboard (e.g. via the Date Strip), the client queries <span class="code-pill">GET /api/whoop/metrics?date=YYYY-MM-DD&timezone=Asia/Kolkata</span>. The server queries WHOOP's v2 endpoints, normalizes units, filters by timezone, and collates signals into a unified schema:
    </p>

    <table>
      <thead>
        <tr>
          <th style="width: 22%;">WHOOP v2 Endpoint</th>
          <th style="width: 28%;">Extracted Raw Fields</th>
          <th style="width: 25%;">Normalization / Unit Logic</th>
          <th style="width: 25%;">Dashboard Mapping</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/developer/v2/cycle</code></td>
          <td><code>score.strain</code>, <code>score.kilojoules</code></td>
          <td>Energy: Converted kJ &times; 0.239006 &rarr; kcal</td>
          <td>Daily Strain (0&ndash;21), Active Energy</td>
        </tr>
        <tr>
          <td><code>/developer/v2/recovery</code></td>
          <td><code>recovery_score</code>, <code>hrv_rmssd_milli</code>, <code>resting_heart_rate</code>, <code>spo2_percentage</code>, <code>skin_temp_celsius</code></td>
          <td>HRV in ms, RHR in bpm, SpO₂ in %, Skin temp &plusmn;&deg;C deviation</td>
          <td><strong>Overall Body</strong> (Recovery %)<br><strong>Blood Health</strong> (HRV, RHR, SpO₂)</td>
        </tr>
        <tr>
          <td><code>/developer/v2/activity/sleep</code></td>
          <td><code>score.sleep_performance_percentage</code>, <code>score.respiratory_rate</code>, duration (ms)</td>
          <td>Duration: ms &rarr; minutes; Filter: nap=false, aligns to cycle end-date</td>
          <td><strong>Overall Body</strong> (Sleep Performance %)<br><strong>Lung Health</strong> (Sleep Resp. Rate)</td>
        </tr>
        <tr>
          <td><code>/developer/v2/activity/workout</code></td>
          <td><code>id</code>, <code>score.strain</code>, <code>score.zone_durations</code></td>
          <td>Count of completed workouts & cumulative strain</td>
          <td>Workout summary banner & session actuals</td>
        </tr>
      </tbody>
    </table>

    <div class="callout">
      <div class="callout-title">Timezone Boundary Handling (IANA Asia/Kolkata)</div>
      Because WHOOP timestamps are stored in UTC ISO-8601, Form uses <span class="code-pill">Intl.DateTimeFormat</span> with the user's localized timezone (<span class="code-pill">Asia/Kolkata</span>) to map cycles and sleep epochs accurately across UTC midnight, preventing day-offset errors.
    </div>

    <h2>3. Gut & Stool Integration Flow</h2>
    
    <h3>3.1 Clinical Foundation: The Bristol Stool Form Scale</h3>
    <p>
      Stool logging directly correlates gastrointestinal transit time with physical exertion, hydration, and nutritional intake. Rather than arbitrary feelings, Form implements the clinically standardized 7-type scale:
    </p>

    <div class="two-col">
      <div class="col">
        <table>
          <thead>
            <tr>
              <th>Bristol Type</th>
              <th>Clinical Presentation</th>
              <th>Physiological Classification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Type 1</strong></td>
              <td>Separate hard lumps, like nuts (hard to pass)</td>
              <td>Severe constipation / dehydration</td>
            </tr>
            <tr>
              <td><strong>Type 2</strong></td>
              <td>Sausage-shaped, but lumpy</td>
              <td>Mild constipation</td>
            </tr>
            <tr>
              <td><strong>Type 3</strong></td>
              <td>Like a sausage with cracks on its surface</td>
              <td>Normal / Healthy transit</td>
            </tr>
            <tr>
              <td><strong>Type 4</strong></td>
              <td>Like a sausage or snake, smooth and soft</td>
              <td>Optimal standard healthy stool</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="col">
        <table>
          <thead>
            <tr>
              <th>Bristol Type</th>
              <th>Clinical Presentation</th>
              <th>Physiological Classification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Type 5</strong></td>
              <td>Soft blobs with clear-cut edges (passed easily)</td>
              <td>Lacking fiber / fast transit</td>
            </tr>
            <tr>
              <td><strong>Type 6</strong></td>
              <td>Fluffy pieces with ragged edges, a mushy stool</td>
              <td>Mild inflammation / diarrhea</td>
            </tr>
            <tr>
              <td><strong>Type 7</strong></td>
              <td>Watery, no solid pieces (entirely liquid)</td>
              <td>Acute diarrhea / infection / stress</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <h3>3.2 Data Structure & Modal Entry Workflow</h3>
    <p>
      Clicking the <strong>Gut</strong> card on the Home screen opens <span class="code-pill">StoolCheckIn</span> in a mobile bottom sheet:
    </p>
    <ul>
      <li><strong>Date & Time</strong>: Defaults to current time; supports retrospective logging.</li>
      <li><strong>Type Selection (1&ndash;7)</strong>: Visual pill buttons with illustrations and descriptors.</li>
      <li><strong>Comfort Assessment</strong>: <em>Comfortable</em>, <em>Mild straining</em>, <em>Painful/Difficult</em>, or <em>Urgent</em>.</li>
      <li><strong>Notes</strong>: Qualitative notes (e.g. food intolerances, travel, pre-workout supplements).</li>
    </ul>

    <div class="callout accent">
      <div class="callout-title">Vendor & Vision Integration Policy (PoopCheck Evaluation)</div>
      <p>
        The endpoint <span class="code-pill">GET /api/health/stool</span> explicitly returns <code>{ configured: false, provider: "PoopCheck" }</code>. While automated camera analysis services exist in the market, Form enforces strict ethical constraints:
      </p>
      <ol style="margin-bottom: 0;">
        <li><strong>No Contract, No Transmission</strong>: Without a formal B2B HIPAA/GDPR data-processing contract and verified India commercial access, zero photos are uploaded anywhere.</li>
        <li><strong>No Generic AI Scraping</strong>: Personal medical images are <em>never</em> sent to consumer general-purpose LLMs (e.g. generic vision APIs) without medical compliance guarantees.</li>
        <li><strong>Self-Contained Manual Log</strong>: Manual logging is 100% functional, secure, offline-capable, and private.</li>
      </ol>
    </div>
  </div>

  <!-- PAGE 3: FULL SYSTEM ARCHITECTURE & INTEGRATION MAP -->
  <div class="page-break">
    <h2>4. End-to-End System Architecture Map</h2>
    <p>
      The diagram below illustrates how client interactions, secure cookies, server endpoints, WHOOP cloud APIs, and the local journal state work together:
    </p>

    <div class="flow-box" style="font-family: monospace; font-size: 8pt; line-height: 1.35; background: #fafafa; border: 1.5px solid #111111;">
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT BROWSER (React 19 / Next.js)                             │
│                                                                                                │
│   ┌───────────────────────────┐    ┌───────────────────────────┐    ┌──────────────────────┐   │
│   │   Home Health Overview    │    │      Morning Check-In     │    │     Gut Check-In     │   │
│   │ [Overall Body] [Blood]    │    │ Scale Camera / Local OCR  │    │ Bristol Types 1 - 7  │   │
│   │ [Lung Health]  [Gut Card] │    │ Kg/Lb, bathroom condition │    │ Comfort & Notes      │   │
│   └─────────────┬─────────────┘    └─────────────┬─────────────┘    └──────────┬───────────┘   │
│                 │                                │                             │               │
│                 │ GET /api/whoop/metrics         │ Store in weights[]          │ Store stools[]│
│                 ▼                                ▼                             ▼               │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                      Local Journal Store (React State & Sync)                          │   │
│   └──────────────────────────────────────────────┬─────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┼─────────────────────────────────────────────┘
                                                   │
                Cookie: form-whoop-session         │ HTTPS
               (AES-256-GCM Encrypted Token)       │
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                NEXT.JS SERVER BACKEND (/api)                                   │
│                                                                                                │
│  ┌───────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────────────┐  │
│  │  /api/whoop/connect   │  │   /api/whoop/callback   │  │        /api/whoop/metrics        │  │
│  │ Generates state &     │  │ Verifies state cookie,  │  │ Auto-refreshes token if needed,  │  │
│  │ redirects to WHOOP    │  │ exchanges code & sets   │  │ pulls cycles, recovery, sleep,   │  │
│  │ consent dialog        │  │ encrypted session cookie│  │ converts kJ->kcal, filters tz    │  │
│  └──────────┬────────────┘  └────────────▲────────────┘  └────────────────┬─────────────────┘  │
│             │                            │                                │                    │
│             │ OAuth 2.0 PKCE             │ Auth Code                      │ Bearer Token       │
│             ▼                            │                                ▼                    │
│  ┌───────────────────────────────────────┴──────────────────────────────────────────────────┐  │
│  │                                  WHOOP API CLOUD (v2)                                    │  │
│  │               https://api.prod.whoop.com/developer/v2/{cycle, recovery, activity}       │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
    </div>

    <h2>5. Physiological Correlations on the Member Dashboard</h2>
    <p>
      By capturing both internal wearable biometrics (WHOOP) and external behavioral inputs (Stool & Scale), Form provides coaches and members with actionable lifestyle insights:
    </p>

    <table>
      <thead>
        <tr>
          <th>Observed Scenario</th>
          <th>WHOOP Biomarker Signal</th>
          <th>Gut & Weight Signal</th>
          <th>Actionable Training Decision</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>High Fatigue / Overreaching</strong></td>
          <td>Recovery &lt; 33% (Red), Low HRV (&minus;20ms), Elevated RHR</td>
          <td>Bristol Type 1 or 2 (Constipation / Slow motility)</td>
          <td>Trainer converts high-load strength session to active recovery or mobility; increase hydration.</td>
        </tr>
        <tr>
          <td><strong>Acute Gut Distress / Stress</strong></td>
          <td>Elevated respiratory rate (&gt;18 rpm), fragmented sleep</td>
          <td>Bristol Type 6 or 7 (Loose/Diarrhea), severe discomfort</td>
          <td>Deload prescribed workout volume; alert member to electrolyte rehydration and rest.</td>
        </tr>
        <tr>
          <td><strong>Peak Performance State</strong></td>
          <td>Recovery &gt; 66% (Green), optimal HRV, 85%+ sleep score</td>
          <td>Bristol Type 3 or 4 (Optimal), standard morning weight</td>
          <td>Member is primed for progressive overload, personal records, and intensive sets.</td>
        </tr>
      </tbody>
    </table>

    <h2>6. Production Readiness & Security Checklist</h2>
    <ul>
      <li><strong>Production User-Bound Tokens</strong>: In the full multi-tenant release, WHOOP tokens should be tied to authenticated user database IDs (e.g. Postgres with pgcrypto / Supabase) rather than browser-scoped cookies.</li>
      <li><strong>WHOOP Webhooks</strong>: Transition from pull polling to WHOOP Developer Webhooks (<code>recovery.updated</code>, <code>workout.updated</code>) to enable proactive background sync.</li>
      <li><strong>Rate Limit Compliance</strong>: Cache metrics per date with standard SWR (Stale-While-Revalidate) to stay well within WHOOP's developer rate tier.</li>
      <li><strong>HIPAA / GDPR Compliance</strong>: Maintain strict patient data isolation for all stool and physiological telemetry.</li>
    </ul>

    <div style="margin-top: 24pt; padding-top: 8pt; border-top: 1px solid #e0e0e0; font-size: 8pt; color: #777777; display: flex; justify-content: space-between;">
      <span>Form Gym Journal &bull; Technical Architecture Documentation</span>
      <span>Confidential &bull; Generated November 2026</span>
    </div>
  </div>

</body>
</html>`;

async function generatePDF() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  const outputPath = "/Users/bhargavadepu/Desktop/GYM Dashboards/WHOOP_AND_STOOL_INTEGRATION_FLOW.pdf";
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "14mm",
      bottom: "14mm",
      left: "14mm",
      right: "14mm",
    },
  });
  await browser.close();
  console.log("PDF generated at: " + outputPath);
}

generatePDF();
