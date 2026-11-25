import test from 'node:test';
import assert from 'node:assert/strict';
import { regionAt } from '../scripts/anatomy-contours.mjs';

// Landmarks on the supplied model's 780×1296 orthographic reference views.
const at = (x, y, z=.1, depth=0) => regionAt((x-390)/600, (648-y)/600, z, depth);

test('quadriceps follow the tapered thigh and exclude the groin and kneecap', () => {
  assert.equal(at(477,580), 'quads');
  assert.equal(at(475,740), 'quads');
  assert.equal(at(459,905), 'quads');
  assert.notEqual(at(420,680), 'quads');
  assert.equal(at(402,658), 'neutral');
  assert.equal(at(467,944), 'neutral');
  assert.equal(at(500,1200), 'neutral');
});

test('front and back muscle contours stay separate around thighs and pelvis', () => {
  assert.equal(at(458,641,-.1), 'glutes');
  assert.equal(at(470,790,-.1), 'hamstrings');
  assert.equal(at(497,1020,-.1), 'calves');
  assert.notEqual(at(470,790), 'hamstrings');
  assert.notEqual(at(458,641), 'glutes');
});

test('upper body outlines exclude the neck and central sternum', () => {
  assert.equal(at(460,340), 'chest');
  assert.equal(at(418,255), 'neutral');
  assert.equal(at(390,340), 'neutral');
  assert.equal(at(590,402), 'biceps');
  assert.equal(at(590,402,-.1), 'triceps');
});

test('limb-local depth prevents front arm surfaces from being painted as triceps', () => {
  assert.equal(at(590,402,-.05,-.08), 'biceps');
  assert.equal(at(590,402,-.11,-.08), 'triceps');
});

test('both sides use matching contours without spilling across the center line', () => {
  for (const [x,y] of [[477,580],[475,740],[459,905],[460,340],[590,402]]) {
    const wx=(x-390)/600, wy=(648-y)/600;
    assert.equal(regionAt(wx,wy,.1), regionAt(-wx,wy,.1));
  }
});
