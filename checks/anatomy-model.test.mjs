import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import { athleticPosition, referencePosture } from '../scripts/athletic-anatomy.mjs';

let manifest, document, nodes;
before(async () => {
  manifest = JSON.parse(await readFile(new URL('../public/anatomy/manifest.json', import.meta.url), 'utf8'));
  await MeshoptDecoder.ready;
  document = await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder }).read(new URL('../public/anatomy/male.glb', import.meta.url).pathname);
  nodes = new Map(document.getRoot().listNodes().map(node => [node.getName(), node]));
});

test('prepared model retains pinned Z-Anatomy provenance and attribution', async () => {
  assert.equal(manifest.model.license, 'CC BY-SA 4.0');
  assert.match(manifest.model.source, /Z-Anatomy\/Models-of-human-anatomy/);
  assert.equal(manifest.form.archiveSha256, 'e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736');
  assert.ok(manifest.form.bytes < 6*1024*1024, 'mobile asset stays below 6 MiB');
  const notice = await readFile(new URL('../public/anatomy/NOTICE.txt', import.meta.url), 'utf8');
  assert.match(notice, /BodyParts3D/); assert.match(notice, /Gauthier Kervyn/);
});

test('all workout groups target distinct authored anatomical objects', () => {
  assert.equal(manifest.regions.length, 18);
  const owners = new Set();
  for (const region of manifest.regions) {
    assert.ok(region.meshNames.length >= 2);
    for (const [index, name] of region.meshNames.entries()) {
      assert.ok(!owners.has(name), `muscle part belongs to one group: ${name}`);
      owners.add(name);
      const node = nodes.get(name);
      assert.ok(node?.getMesh(), `authored muscle mesh retained: ${name}`);
      assert.equal(node.getExtras().muscleGroup, region.muscle);
      assert.equal(node.getExtras().anatomicalName, region.anatomicalNames[index]);
    }
  }
  assert.equal(owners.size, 114);
});

test('pectorals, deltoid heads and quadriceps retain their actual muscle boundaries', () => {
  const names = group => manifest.regions.find(region=>region.muscle===group).anatomicalNames;
  assert.equal(names('chest').length, 6);
  assert.ok(names('chest').every(name=>/pectoralis major/i.test(name)));
  assert.ok(names('front-shoulders').every(name=>/(clavicular|acromial) part of deltoid/i.test(name)));
  assert.ok(names('rear-shoulders').every(name=>/scapular spinal part of deltoid/i.test(name)));
  assert.equal(names('quads').length, 8);
  for (const muscle of ['Rectus femoris','Vastus medialis','Vastus lateralis','Vastus intermedius']) {
    assert.equal(names('quads').filter(name=>name.startsWith(muscle)).length, 2);
  }
});

test('muscle and tendon surfaces stay separate so green never paints tendons', () => {
  const materialNames = new Set(document.getRoot().listMaterials().map(material=>material.getName()));
  assert.ok(materialNames.has('Form Muscle tissue'));
  assert.ok(materialNames.has('Form Tendon tissue'));
  for (const name of manifest.regions.find(region=>region.muscle==='chest').meshNames) {
    const materials = nodes.get(name).getMesh().listPrimitives().map(primitive=>primitive.getMaterial().getName());
    assert.ok(materials.includes('Form Muscle tissue'));
    assert.ok(materials.includes('Form Tendon tissue'));
  }
  const muscle = document.getRoot().listMaterials().find(material=>material.getName()==='Form Muscle tissue');
  const [red, green, blue] = muscle.getBaseColorFactor();
  assert.ok(red > green && red > blue, 'untrained muscle uses the natural anatomical palette');
});

test('optimized model stays centered, valid, and free of unrelated organ geometry', () => {
  const bounds = getBounds(document.getRoot().getDefaultScene());
  assert.ok(Math.abs(bounds.max[1]-bounds.min[1]-2) < .005);
  for (let axis=0; axis<3; axis++) assert.ok(Math.abs(bounds.max[axis]+bounds.min[axis]) < .005);
  assert.ok(manifest.form.triangles < manifest.form.sourceTriangles);
  assert.ok(!manifest.anatomy.some(part=>/kidney|cochlea|semicircular|labyrinth/i.test(part.anatomicalName)));
  for (const mesh of document.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
    assert.ok(primitive.getAttribute('POSITION').getCount() > 0);
    assert.ok(primitive.getAttribute('POSITION').getArray().every(Number.isFinite));
  }
});

test('athletic shape adds body volume without folding, changing height, or separating sides', () => {
  assert.equal(manifest.appearance.version, 4);
  assert.equal(document.getRoot().getAsset().extras.formAthleticBuild, 4);
  assert.ok(athleticPosition([.23,.58,0])[0] > .23*1.15, 'broader shoulder silhouette');
  assert.ok(athleticPosition([.10,.48,.12])[2] > .15, 'fuller pectoral depth');
  for (const point of [[.1,.85,.1],[.14,-.96,.05]]) assert.deepEqual(athleticPosition(point), point, 'head and feet retain their shape');
  const epsilon = .00001;
  for (let y=-.9; y<=.8; y+=.05) for (let x=.01; x<=.45; x+=.025) {
    const p = athleticPosition([x,y,.1]);
    const mirrored = athleticPosition([-x,y,.1]);
    assert.equal(p[1], y);
    assert.ok(Math.abs(p[0]+mirrored[0]) < 1e-12);
    assert.equal(p[2], mirrored[2]);
    const dx = athleticPosition([x+epsilon,y,.1]);
    const dz = athleticPosition([x,y,.1+epsilon]);
    const determinant = ((dx[0]-p[0])*(dz[2]-p[2])-(dx[2]-p[2])*(dz[0]-p[0]))/(epsilon*epsilon);
    assert.ok(determinant > .2, 'shared spatial deformation does not invert tissue');
  }
});

test('outer thigh and fascia never receive the shoulder rotation', () => {
  const angle = 10*Math.PI/180;
  for (const side of [-1,1]) for (const x of [.18,.20,.22]) for (const y of [-.15,-.25,-.4]) {
    const posed = referencePosture([side*x,y,.03]);
    const expectedX = .105+Math.cos(angle)*(x-.105)-Math.sin(angle)*y;
    const expectedY = Math.sin(angle)*(x-.105)+Math.cos(angle)*y;
    assert.ok(Math.abs(posed[0]-side*expectedX) < 1e-10, 'lateral thigh follows hip rotation only');
    assert.ok(Math.abs(posed[1]-expectedY) < 1e-10);
    assert.equal(posed[2], .03);
  }
});

test('reference A-pose opens the hands and stance symmetrically while preserving the head', () => {
  assert.deepEqual(referencePosture([.08,.85,.1]), [.08,.85,.1]);
  const hand = [.38,-.12,.02];
  const posed = referencePosture(hand);
  assert.ok(posed[0] > hand[0]+.2);
  assert.ok(posed[1] > hand[1]+.08);
  const mirrored = referencePosture([-hand[0],hand[1],hand[2]]);
  assert.deepEqual(mirrored, [-posed[0],posed[1],posed[2]]);
  const foot = referencePosture([.15,-.96,.05]);
  assert.ok(foot[0] > .30);
  assert.equal(foot[2], .05);
  // The hand/fingers and elbow are in the rigid arm region, not the shoulder blend.
  const elbow = [.29,.24,.02];
  const posedElbow = referencePosture(elbow);
  assert.ok(Math.abs(Math.hypot(posed[0]-posedElbow[0],posed[1]-posedElbow[1])-Math.hypot(hand[0]-elbow[0],hand[1]-elbow[1])) < 1e-8);
});
