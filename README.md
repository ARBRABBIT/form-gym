# Form — gym journal

Requires Node 24+. A responsive member and trainer prototype built from `Gym_Dashboards_Design_Prompt.md` and the supplied journal photographs.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Sign up or log in through the labeled demo flow to set up a personal journal. Choose **Explore the sample journal** to review illustrative Indian member profiles and a sample assigned workout. Use the **Member view** and **Trainer view** tabs in the dashboard header.

The app includes onboarding, planner, habits, the 100-day challenge, weight tracking, measurements, monthly review, workout logging, nutrition and wellness, plus trainer assignments and submitted-log review. Plans and member logs are separate records; later plan changes preserve submitted actuals and the original plan snapshot.

Data is saved in this browser. Other tabs on the same origin synchronize saved changes. This prototype does not connect to a backend or provide authentication.

```sh
npm run build
npm run typecheck
npx playwright install chromium
npm test
```

For the field checklist, trainer/member walkthrough and unresolved product decisions, see [HANDOFF.md](HANDOFF.md). The visual system is documented in [DESIGN.md](DESIGN.md).

Health cards, morning photo check-ins, gut tracking and scheduled push reminders are described in [HEALTH.md](HEALTH.md). The dev/start commands also run the reminder worker. Local photo OCR works without an API key; WHOOP and optional cloud OCR need credentials. Phone notifications need HTTPS and user permission.
