import env from '@next/env';
const { loadEnvConfig } = env;
loadEnvConfig(process.cwd());
const { sendDueReminders } = await import('../src/lib/reminders.ts');
let running = false;
async function tick() {
  if (running) return;
  running = true;
  try { await sendDueReminders(); }
  catch { process.stderr.write('Reminder delivery unavailable; will retry.\n'); }
  finally { running = false; }
}
await tick();
const timer = setInterval(tick, 30000);
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { clearInterval(timer); process.exit(0); });
process.stdout.write('Morning reminders: worker running.\n');
