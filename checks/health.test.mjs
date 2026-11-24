import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scaleReading } from '../src/lib/health.ts';
const directory = mkdtempSync(join(tmpdir(), 'form-reminders-'));
process.env.FORM_DATA_DIR = directory;
const { localClock, validSubscription, reminderMessage, reminderDb, sendDueReminders } = await import('../src/lib/reminders.ts');
after(() => { reminderDb().close(); rmSync(directory, { recursive: true, force: true }); });
test('scale reading handles decimal comma and units but refuses ambiguous displays', () => {
  assert.deepEqual(scaleReading('72,5 kg'), { weight: 72.5, unit: 'kg' });
  assert.deepEqual(scaleReading('158.7 lbs'), { weight: 158.7, unit: 'lb' });
  assert.equal(scaleReading('72.5 kg\n73.0 kg'), null);
  assert.equal(scaleReading('2026\nBattery low'), null);
  assert.deepEqual(scaleReading('72.5'), { weight: 72.5, unit: null });
});
test('IST reminder follows the local day across UTC midnight', () => {
  assert.deepEqual(localClock('Asia/Kolkata', new Date('2026-11-22T20:00:00Z')), { day: '2026-11-23', minutes: 90 });
});
test('push endpoints cannot target private services', () => {
  assert.equal(validSubscription({ endpoint: 'https://127.0.0.1/admin', keys: {} }), false);
  assert.equal(validSubscription({ endpoint: 'https://fcm.googleapis.com.evil.test/push', keys: {} }), false);
});
test('a completed check-in suppresses the due reminder, including snoozes', async () => {
  const db = reminderDb();
  db.prepare("INSERT INTO reminders(id,subscription,time,timezone,tone,skipped_date,snooze_at) VALUES (?,?,?,?,?,?,?)").run('test-device','{}','07:30','Asia/Kolkata','friendly','2026-11-23',1);
  assert.deepEqual(await sendDueReminders(new Date('2026-11-23T02:01:00Z')), { sent: 0 });
  assert.equal(db.prepare('SELECT last_sent FROM reminders WHERE id=?').get('test-device').last_sent, '');
  assert.equal(reminderMessage('friendly','2026-11-23').body.includes('Bathroom'), false);
});
