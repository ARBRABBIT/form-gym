import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialStore, newMemberStore, TODAY } from '../src/lib/model.ts';
import { sampleHealth } from '../src/lib/health.ts';

test('sample data never leaks into a new personal journal', () => {
  const sample = initialStore();
  assert.equal(sample.sampleData, true);
  assert.ok(sample.logs && Object.keys(sample.logs).length);
  assert.ok(sample.nutrition[TODAY].meals.Dinner.length);
  const personal = newMemberStore('test@example.com', 'Test Member');
  assert.equal(personal.sampleData, false);
  for (const key of ['nutrition', 'plans', 'logs', 'measurements', 'reviews']) assert.deepEqual(personal[key], {});
  assert.deepEqual(personal.workoutLibrary, []);
  assert.deepEqual(personal.weights, []);
  assert.equal(personal.profile.Name, 'Test Member');
  sample.nutrition[TODAY].water = 6;
  assert.deepEqual(personal.nutrition, {});
});

test('sample metrics cannot claim a real WHOOP connection', () => {
  const health = sampleHealth(TODAY);
  assert.equal(health.connected, false);
  assert.equal(health.configured, false);
  assert.equal(health.fetchedAt, undefined);
  assert.ok(health.recovery > 0);
});

test('signed-in preview fills gaps while preserving identity and existing records', async () => {
  const { withSamplePreview } = await import('../src/lib/model.ts');
  const current = newMemberStore('bhargav@example.com', 'Bhargav Adepu');
  current.onboarded = true;
  current.weights = [{ id: 'real-weight', date: TODAY, weight: '80', gain: '', loss: '', notes: 'My entry' }];
  current.nutrition[TODAY] = { metrics: { Steps: '12000' }, water: 1, meals: { Breakfast: [{ id: 'mine', product: 'My breakfast', serving: '1', calories: '300', protein: '10', carbs: '20', fat: '5' }], Lunch: [], Dinner: [], 'Supplements/Snacks': [] } };
  const preview = withSamplePreview(current);
  assert.equal(preview.sampleData, true);
  assert.equal(preview.profile.Name, 'Bhargav Adepu');
  assert.equal(preview.account.email, 'bhargav@example.com');
  assert.equal(preview.nutrition[TODAY].meals.Breakfast[0].product, 'My breakfast');
  assert.ok(preview.nutrition[TODAY].meals.Lunch.length);
  assert.equal(preview.nutrition[TODAY].metrics.Steps, '12000');
  assert.equal(preview.weights.filter(w => w.date === TODAY).length, 1);
  assert.equal(preview.weights.find(w => w.date === TODAY).weight, '80');
  assert.ok(preview.plans[`alex:${TODAY}`]);
  assert.equal(current.sampleData, false);
});
