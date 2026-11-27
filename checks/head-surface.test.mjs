import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { matchHeadSurface } from '../src/components/muscle-surface.ts';

test('head finish blends facial support surfaces without repainting body tendons, eyes or teeth', () => {
  const geometry = new THREE.BufferGeometry();
  const original = new Float32Array([0,.2,0, 0,.85,0, .02,.96,0]);
  geometry.setAttribute('position', new THREE.BufferAttribute(original.slice(),3));
  const bone = new THREE.MeshStandardMaterial({color:'#e9e1d3'});
  bone.name = 'Form Bone';
  const mesh = new THREE.Mesh(geometry,bone);
  mesh.updateMatrixWorld();
  assert.equal(matchHeadSurface(mesh,[bone]),true);
  const color = geometry.getAttribute('color');
  assert.deepEqual(Array.from(color.array.slice(0,3)),[1,1,1], 'body stays neutral');
  assert.ok(color.getX(1) > color.getY(1) && color.getY(1) > color.getZ(1), 'facial tint is warm');
  assert.deepEqual(geometry.getAttribute('position').array,original, 'facial geometry is retained');
  assert.equal(bone.vertexColors,true);
  for (const name of ['Form Eye','Form Iris','Form Teeth','Form Muscle tissue']) {
    const material = new THREE.MeshStandardMaterial(); material.name = name;
    assert.equal(matchHeadSurface(mesh,[material]),false,`${name} keeps its existing finish`);
    material.dispose();
  }
  geometry.dispose(); bone.dispose();
});
